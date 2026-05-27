import { useEffect, useState } from "react";
import {
    fetchJornadasProductividad,
    fetchTareasProductividad,
    fetchTecnicosProductividad,
    fetchTecnicosProductividadV125,
    type JornadaData,
    type JornadaRow,
} from "../services/productividadService";
import { formatearFecha, getDuracionTarea, parseFecha } from "../utils/timeUtils";
import type { TecData, TareaData } from "../utils/rankingHelpers";

// Tipos auxiliares para indexar tareas y jornadas utilizando el código del técnico como clave
type TareasPorTecnico = Record<string, TareaData[]>;
type JornadasPorTecnico = Record<string, JornadaData>;

/**
 * Convierte un registro de jornada de la base de datos (con posibles fechas en string)
 * en un objeto de tipo JornadaData (con objetos Date o null).
 */
function mapJornada(row: JornadaRow): JornadaData {
    const inicio = parseFecha(typeof row.FECHA_INI === "string" ? row.FECHA_INI : undefined);
    const finRaw = parseFecha(typeof row.FECHA_FIN === "string" ? row.FECHA_FIN : undefined);
    
    // Validación de seguridad: el fin de jornada debe ocurrir el mismo día que el inicio
    // Si la fecha de fin pertenece a otro día, se ignora (se pone null) por posible error de fichaje
    const fin = inicio && finRaw && inicio.toDateString() === finRaw.toDateString() ? finRaw : null;
    
    return { inicio, fin };
}

/**
 * Normaliza cualquier tipo de código entrante convirtiéndolo en un string limpio sin espacios.
 */
function normalizarCodigo(raw: unknown): string {
    if (raw === null || raw === undefined) return "";
    return String(raw).trim();
}

/**
 * Extrae y normaliza el código del técnico de una fila de la base de datos.
 * Resuelve inconsistencias en el nombre de la columna (COD_TECNICO vs CODIGO_TECNICO).
 */
function getCodTecnico(row: { COD_TECNICO?: unknown; CODIGO_TECNICO?: unknown }): string {
    const cod = normalizarCodigo(row.COD_TECNICO);
    if (cod) return cod;
    return normalizarCodigo(row.CODIGO_TECNICO);
}

/**
 * Hook personalizado (Custom Hook) que gestiona la carga y estructuración de los datos 
 * necesarios para la página de ranking/productividad de técnicos.
 * 
 * - Obtiene la lista de técnicos, sus tareas y su jornada diaria.
 * - Agrupa la información de tareas y jornadas por técnico.
 * - Actualiza automáticamente la información en segundo plano ("silent reload").
 */
export function useRankingData(
    fechaConsulta: string,
    mainplant: string | null,
    version: "79" | "125" = "79", // Permite alternar entre diferentes endpoints de API si es necesario
) {
    // Estados principales
    const [tecnicos, setTecnicos] = useState<TecData[]>([]);
    const [tareasPorTecnico, setTareasPorTecnico] = useState<TareasPorTecnico>({});
    const [jornadaPorTecnico, setJornadaPorTecnico] = useState<JornadasPorTecnico>({});
    
    // Estados de UI y control
    const [cargando, setCargando] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Efecto principal: Se ejecuta cuando cambia la fecha, la planta (delegación) o la versión API
    useEffect(() => {
        let active = true; // Control de desmonte (previene actualizar estado si el componente se desmonta)

        const loadData = async (silent = false) => {
            // Si no hay planta definida, no se hace petición y se resetean estados
            if (!mainplant) {
                setTecnicos([]);
                setTareasPorTecnico({});
                setJornadaPorTecnico({});
                setDataLoaded(false);
                return;
            }

            try {
                // Si no es una recarga silenciosa, activa el spinner de carga visual
                if (!silent) setCargando(true);
                setDataLoaded(false);
                setErrorMsg(null);

                // Cálculo del rango de fechas (desde fechaConsulta 00:00:00 hasta el día siguiente 00:00:00)
                const [year, month, day] = fechaConsulta.split("-").map(Number);
                const fechaIni = new Date(year, month - 1, day);
                const fechaFin = new Date(year, month - 1, day + 1);
                
                // Formateo a string (YYYY-MM-DD) para la API
                const fIni = formatearFecha(fechaIni);
                const fFin = formatearFecha(fechaFin);

                // Selección dinámica de la función fetch según versión
                const fetchTecnicos = version === "125" ? fetchTecnicosProductividadV125 : fetchTecnicosProductividad;

                // Promise.all permite hacer las 3 peticiones en paralelo (reduciendo el tiempo total de carga)
                const [tecnicosData, tareasData, jornadasData] = await Promise.all([
                    fetchTecnicos(mainplant),
                    fetchTareasProductividad(mainplant, fIni, fFin),
                    fetchJornadasProductividad(mainplant, fIni, fFin),
                ]);

                // Si el componente se desmontó mientras cargaban los datos, aborta
                if (!active) return;

                // 1. Agrupación de Tareas: crear diccionario usando COD_TECNICO como llave
                const tareasMapped: TareasPorTecnico = {};
                for (const tarea of tareasData) {
                    const codigo = getCodTecnico(tarea);
                    if (!codigo) continue;
                    if (!tareasMapped[codigo]) tareasMapped[codigo] = [];
                    tareasMapped[codigo].push(tarea);
                }

                // 2. Agrupación de Jornadas: crear diccionario usando COD_TECNICO como llave
                const jornadasMapped: JornadasPorTecnico = {};
                for (const row of jornadasData) {
                    const codigo = getCodTecnico(row);
                    if (!codigo) continue;
                    jornadasMapped[codigo] = mapJornada(row);
                }

                // 3. Actualizar los estados de React
                setTecnicos(tecnicosData);
                setTareasPorTecnico(tareasMapped);
                setJornadaPorTecnico(jornadasMapped);
                setDataLoaded(true);
            } catch (error) {
                console.error("Error cargando productividad:", error);
                const msg = error instanceof Error && error.message
                        ? error.message
                        : "Error inesperado cargando productividad";
                
                if (active) {
                    // En caso de error, limpiar datos antiguos y mostrar mensaje
                    setTecnicos([]);
                    setTareasPorTecnico({});
                    setJornadaPorTecnico({});
                    setDataLoaded(false);
                    setErrorMsg(msg);
                }
            } finally {
                // Desactiva el flag de carga una vez finalice el proceso (con éxito o error)
                if (active) setCargando(false);
            }
        };

        // 1. Ejecutar carga inicial
        loadData();
        
        // 2. Configurar "polling" (recarga automática silenciosa cada 60 segundos)
        // Esto mantiene la línea de tiempo actualizada a medida que avanza el día o se introducen tareas
        const interval = setInterval(() => loadData(true), 60000);

        // 3. Función de limpieza (Cleanup) al desmontar o cambiar dependencias
        return () => {
            active = false; // Invalida las promesas pendientes
            clearInterval(interval); // Detiene el polling
        };
    }, [fechaConsulta, mainplant, version]);

    return {
        tecnicos,
        setTecnicos, // Expuesto para poder modificar la visibilidad (ej: checkboxes en FiltroRegiones)
        tareasPorTecnico,
        jornadaPorTecnico,
        cargando,
        dataLoaded,
        errorMsg,
    };
}
  