import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../Context/AuthContext";
import { useSelection } from "../../../Context/SelectionContext";
import { fetchTareasProductividad, fetchJornadasProductividad, fetchTecnicosProductividad } from "../../../services/productividadService";
import { formatearFecha, getDuracionTarea } from "../../../utils/timeUtils";
import { getColorTipoTarea, type TecData, type TareaData } from "../../../utils/rankingHelpers";
import Loader from "../../../Components/common/Loader";
import ErrorMessage from "../../../Components/common/ErrorMessage";
import useBackgroundImage from "../../../Hooks/useBackgroundImage";
import { obtenerRegionActual, obtenerDelegacionesVista, resolverMainplant } from "../../../config/regionConfig";
import "./estadisticas.css";

/**
 * Interfaz que define la estructura de los datos estadísticos por técnico.
 */
interface StatsTecnico {
    tec: TecData; // Datos del técnico
    horasImputadas: number; // Media de horas imputadas por día
    prodBruta: number; // Porcentaje de productividad bruta
    prodNeta: number; // Porcentaje de productividad neta
}

/**
 * Componente que muestra las estadísticas de productividad agrupadas por técnico,
 * calculando rendimientos basados en las horas de tareas vs las horas de jornada ideales.
 */
export default function EstadisticasProductividad() {
    const navigate = useNavigate();
    const { user } = useAuth(); // Contexto de autenticación
    const { selectedRegion, selectedDelegations } = useSelection(); // Contexto global de filtros de región/delegación

    // Cambiar imagen de fondo para esta vista
    useBackgroundImage("/img/Fondo_Escritorio_2.jpg", "Estadísticas de Productividad");

    // Estados de UI y control de errores
    const [cargando, setCargando] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [stats, setStats] = useState<StatsTecnico[]>([]); // Almacena el listado final de estadísticas a renderizar

    // Valores por defecto para el rango de fechas (últimos 7 días hasta hoy)
    const initialFechaIni = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().split("T")[0];
    }, []);
    const initialFechaFin = useMemo(() => new Date().toISOString().split("T")[0], []);

    // Estados para los inputs de los filtros de fecha (lo que el usuario está escribiendo)
    const [fechaIniInput, setFechaIniInput] = useState(initialFechaIni);
    const [fechaFinInput, setFechaFinInput] = useState(initialFechaFin);

    // Estados para las fechas que ya han sido aplicadas (disparan la consulta)
    const [fechaIniAplicada, setFechaIniAplicada] = useState(initialFechaIni);
    const [fechaFinAplicada, setFechaFinAplicada] = useState(initialFechaFin);

    // Lógica de permisos y determinación de delegaciones a consultar (mainplant)
    const regionParam = useMemo(() => obtenerRegionActual(selectedRegion, user?.regiones), [selectedRegion, user?.regiones]);
    const allowed = useMemo(() => obtenerDelegacionesVista(user?.delegaciones, regionParam, "RANKPROD"), [user?.delegaciones, regionParam]);
    const mainplant = useMemo(() => resolverMainplant({
        seleccion: selectedDelegations,
        permitidas: allowed,
        modo: "filtrado",
        devolverNullSinPermitidas: true,
    }), [selectedDelegations, allowed]);

    // Efecto principal que recarga las estadísticas cada vez que cambia la planta o el rango de fechas aplicado
    useEffect(() => {
        if (!mainplant) return; // Si no hay permisos o selección válida, no hacer peticiones

        const loadStats = async () => {
            setCargando(true);
            setErrorMsg(null);
            try {
                // Formateo de fechas añadiendo la hora para abarcar días completos
                const fIni = formatearFecha(new Date(fechaIniAplicada + "T00:00:00"));
                const fFinDate = new Date(fechaFinAplicada + "T00:00:00");
                fFinDate.setDate(fFinDate.getDate() + 1); // Sumar un día para incluir el fin de fecha completo
                const fFin = formatearFecha(fFinDate);

                // Llamadas concurrentes al backend para obtener técnicos, tareas y jornadas
                const [tecnicos, tareas, jornadas] = await Promise.all([
                    fetchTecnicosProductividad(mainplant),
                    fetchTareasProductividad(mainplant, fIni, fFin),
                    fetchJornadasProductividad(mainplant, fIni, fFin)
                ]);

                // Agrupar los datos crudos en la estructura StatsTecnico para cada técnico
                const newStats: StatsTecnico[] = tecnicos.map(tec => {
                    // Filtrar solo las tareas correspondientes a este técnico
                    const tareasTec = tareas.filter(t => (t.COD_TECNICO || t.CODIGO_TECNICO) === tec.codigo);

                    // Contar días únicos con actividad (para calcular medias diarias)
                    const diasConTareas = new Set(tareasTec.map(t => t.FECHA_INI.split("T")[0]));
                    const numDias = diasConTareas.size || 1; // Evitar división por cero

                    let minsProductivosBruta = 0;
                    let minsProductivosNeta = 0;
                    let minsTotalesImputados = 0;

                    // Acumular duraciones según el tipo de tarea
                    tareasTec.forEach(t => {
                        const dur = getDuracionTarea(t.FECHA_INI, t.FECHA_FIN);
                        minsTotalesImputados += dur;

                        const tipo = getColorTipoTarea(t); // Usado aquí como proxy para categorizar tareas

                        // Lógica de numeradores: Actividades productivas suman para bruta y neta
                        if (tipo === "actividadProductiva" || tipo === "trabajoEventos") {
                            minsProductivosBruta += dur;
                            minsProductivosNeta += dur;
                        }
                        // La actividad diaria suele contar para la productividad bruta pero a veces no para la neta
                        else if (tipo === "actividadDiaria") {
                            minsProductivosBruta += dur;
                            // Nota: Si fuera requerida en neta, se sumaría aquí
                        }
                    });

                    // Calcular la media de horas imputadas al día
                    const mediaHorasImputadas = minsTotalesImputados / (60 * numDias);

                    // Denominador: se usa el máximo entre una jornada ideal (8 horas) y las horas realmente imputadas
                    const horasDenominador = Math.max(8 * numDias, minsTotalesImputados / 60);
                    const minsDenominador = horasDenominador * 60;

                    // Cálculos finales de porcentaje de productividad
                    const prodBruta = minsDenominador > 0 ? (minsProductivosBruta / minsDenominador) * 100 : 0;
                    const prodNeta = minsDenominador > 0 ? (minsProductivosNeta / minsDenominador) * 100 : 0;

                    return {
                        tec,
                        horasImputadas: mediaHorasImputadas,
                        prodBruta,
                        prodNeta
                    };
                });

                // Ordenar la lista resultante de mayor a menor productividad neta
                setStats(newStats.sort((a, b) => b.prodNeta - a.prodNeta));
            } catch (err) {
                setErrorMsg("Error cargando estadísticas");
                console.error(err);
            } finally {
                setCargando(false);
            }
        };

        loadStats();
    }, [mainplant, fechaIniAplicada, fechaFinAplicada]);

    /**
     * Aplica los valores de los inputs de fecha al estado aplicado, lo cual dispara el `useEffect` de carga.
     */
    const handleEvaluar = () => {
        setFechaIniAplicada(fechaIniInput);
        setFechaFinAplicada(fechaFinInput);
    };

    // Identificar el mejor y el peor técnico basados en la productividad neta (stats ya viene ordenado)
    const mejorTecnico = useMemo(() => stats.length > 0 ? stats[0].tec.codigo : null, [stats]);

    const peorTecnico = useMemo(() => {
        // Para calcular el peor, ignoramos a los que tienen 0 horas imputadas (ej. vacaciones, ausencias)
        const conDatos = stats.filter(s => s.horasImputadas > 0);
        return conDatos.length > 0 ? conDatos[conDatos.length - 1].tec.codigo : null;
    }, [stats]);

    return (
        <div id="estadisticas-page">
            {/* Cabecera de la página con título y filtros */}
            <header className="stats-header">
                <button className="btn-back" onClick={() => navigate(-1)}>Volver</button>
                <h1 className="stats-title">Productividad</h1>

                <div className="stats-filtros">
                    <div className="filtro-group">
                        <label>Fecha de Inicio:</label>
                        <input type="date" value={fechaIniInput} onChange={(e) => setFechaIniInput(e.target.value)} />
                    </div>
                    <div className="filtro-group">
                        <label>Fecha de Fin:</label>
                        <input type="date" value={fechaFinInput} onChange={(e) => setFechaFinInput(e.target.value)} />
                    </div>
                </div>
            </header>

            {/* Botón para aplicar el rango de fechas seleccionado */}
            <div className="stats-action">
                <button className="btn-evaluar" onClick={handleEvaluar}>Evaluar</button>
            </div>

            {/* Feedback de estado (carga/errores) */}
            {cargando && <Loader />}
            <ErrorMessage message={errorMsg || ""} onClear={() => setErrorMsg(null)} />

            {/* Grid donde se renderiza cada tarjeta (card) de técnico */}
            <div className="stats-grid">
                {stats.map(s => {
                    const isMejor = s.tec.codigo === mejorTecnico;
                    const isPeor = s.tec.codigo === peorTecnico;
                    // Asignación de estilos basados en rendimiento
                    const cardClass = getCardClass(s.horasImputadas, s.prodNeta, isMejor, isPeor);

                    return (
                        <div key={s.tec.codigo} className={`stats-card ${cardClass}`}>
                            <div className="card-header">
                                {/* Icono de usuario, clicable para ir al perfil */}
                                <div
                                    className="tec-icon"
                                    onClick={() => navigate(`/RegistroTecnico/${s.tec.codigo}`, { state: { nombre: s.tec.nombre } })}
                                    title="Ver registro del técnico"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                    </svg>
                                </div>
                                {/* Información de nombre e id, clicable para ir al perfil */}
                                <div className="tec-info" onClick={() => navigate(`/RegistroTecnico/${s.tec.codigo}`, { state: { nombre: s.tec.nombre } })} style={{ cursor: 'pointer' }}>
                                    <span className="tec-id">{s.tec.codigo}</span>
                                    <span className="tec-name">{s.tec.nombre}</span>
                                </div>
                            </div>

                            {/* Tabla de valores estadísticos del técnico */}
                            <table className="stats-table">
                                <tbody>
                                    <tr>
                                        <td>Horas imputadas</td>
                                        <td className="stat-value">{s.horasImputadas.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td>Productividad Bruta</td>
                                        <td className="stat-value">{s.prodBruta.toFixed(0)}%</td>
                                    </tr>
                                    <tr>
                                        <td>Productividad Neta</td>
                                        <td className="stat-value">{s.prodNeta.toFixed(0)}%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * Función que determina la clase CSS de una tarjeta para darle un código de colores 
 * visual dependiendo del rendimiento del técnico en sus estadísticas.
 */
function getCardClass(horas: number, neta: number, isMejor: boolean, isPeor: boolean): string {
    if (horas === 0) return "card-red-border"; // Sin horas trabajadas (ej. vacaciones)
    if (isMejor) return "card-green"; // El de mejor rendimiento neta
    if (isPeor) return "card-dark-red"; // Peor evaluación neta con horas trabajadas
    if (horas < 7.5) return "card-yellow-border"; // Aviso de que no ha llegado a las horas mínimas diarias esperadas
    return "card-blue"; // Estado normal aceptable
}  