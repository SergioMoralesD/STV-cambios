import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../Context/AuthContext";
import { useSelection } from "../../../Context/SelectionContext";
import { fetchDetalleTecnicos, fetchDetalleTareas, fetchDetalleJornadas } from "../../../services/productividadService";
import { formatearFecha } from "../../../utils/timeUtils";
import Loader from "../../../Components/common/Loader";
import ErrorMessage from "../../../Components/common/ErrorMessage";
import LineaTiempoTecnico from "../../../Components/ProducTecnicos/LineaTiempoTecnico";
import useBackgroundImage from "../../../Hooks/useBackgroundImage";
import { obtenerRegionActual, obtenerDelegacionesVista, resolverMainplant } from "../../../config/regionConfig";
import { type TecData, type TareaData } from "../../../utils/rankingHelpers";
import { type JornadaRow, type JornadaData } from "../../../services/productividadService";
import "./detalle.css";



export default function DetalleTecnicoDetallado() {
    const { codigo } = useParams<{ codigo: string }>();
    const { user } = useAuth();
    const { selectedRegion, selectedDelegations } = useSelection();
    const navigate = useNavigate();

    useBackgroundImage("/img/Fondo_Escritorio_2.jpg", "Detalle de Técnico");

    const [tecnicoLabel, setTecnicoLabel] = useState<string>("");
    const [cargando, setCargando] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const initialFechaIni = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, []);
    const initialFechaFin = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, []);

    const [fechaIniInput, setFechaIniInput] = useState(initialFechaIni);
    const [fechaFinInput, setFechaFinInput] = useState(initialFechaFin);
    const [fechaIniAplicada, setFechaIniAplicada] = useState(initialFechaIni);
    const [fechaFinAplicada, setFechaFinAplicada] = useState(initialFechaFin);

    const [dataPorDia, setDataPorDia] = useState<Array<{ label: string; subLabel: string; tareas: TareaData[]; jornada: JornadaData | null }>>([]);
    const [notificacion, setNotificacion] = useState<string | null>(null);

    const regionParam = useMemo(() => obtenerRegionActual(selectedRegion, user?.regiones), [selectedRegion, user?.regiones]);

    const allowed = useMemo(() => {
        return obtenerDelegacionesVista(user?.delegaciones, regionParam, "PRODTEC");
    }, [user?.delegaciones, regionParam]);

    const mainplant = useMemo(() => resolverMainplant({
        seleccion: selectedDelegations,
        permitidas: allowed,
        modo: "filtrado",
        devolverNullSinPermitidas: true,
    }), [selectedDelegations, allowed]);

    const copiarAPortapapeles = async (texto: string) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(texto);
            } else {
                const input = document.createElement("input");
                input.style.position = "absolute";
                input.style.left = "-9999px";
                input.value = texto;
                document.body.appendChild(input);
                input.select();
                document.execCommand("copy");
                document.body.removeChild(input);
            }
            setNotificacion(`Código del aviso copiado: ${texto}`);
            setTimeout(() => setNotificacion(null), 2500);
        } catch (error) {
            console.error("Error copiando:", error);
        }
    };



    

    const handleMouseEnter = (content: string) => {
        const hoverDiv = document.getElementById("divHoverRanking");
        if (!hoverDiv) return;
        hoverDiv.innerHTML = content;
        hoverDiv.style.display = "block";
    };

    const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
        const hoverDiv = document.getElementById("divHoverRanking");
        if (!hoverDiv) return;
        
        let leftPos = e.clientX + 15;
        let topPos = e.clientY + 15;

        if (leftPos + hoverDiv.offsetWidth > window.innerWidth) {
            leftPos = e.clientX - hoverDiv.offsetWidth - 15;
        }
        if (topPos + hoverDiv.offsetHeight > window.innerHeight) {
            topPos = e.clientY - hoverDiv.offsetHeight - 15;
        }

        hoverDiv.style.left = `${leftPos}px`;
        hoverDiv.style.top = `${topPos}px`;
    };

    const handleMouseLeave = () => {
        const hoverDiv = document.getElementById("divHoverRanking");
        if (hoverDiv) hoverDiv.style.display = "none";
    };

    useEffect(() => {
        if (!codigo || !mainplant) return;

        const loadDetalle = async (silent = false) => {
            if (!silent) setCargando(true);
            setErrorMsg(null);
            try {
                //Obtener nombre del técnico (V71)
                const fIni = formatearFecha(new Date(fechaIniAplicada + "T00:00:00"));
                const fFinDate = new Date(fechaFinAplicada + "T00:00:00");
                fFinDate.setDate(fFinDate.getDate() + 1);
                const fFin = formatearFecha(fFinDate);

                const listaTecs = await fetchDetalleTecnicos(codigo, fIni, fFin, mainplant);
                const tec = listaTecs.find((t: TecData) => t.codigo === codigo);
                if (tec) setTecnicoLabel(`${tec.codigo} - ${tec.nombre}`);
                else setTecnicoLabel(codigo);

                //Obtener tareas y jornadas en el rango (V85, V134)
                const [tareas, jornadas] = await Promise.all([
                    fetchDetalleTareas(codigo, fIni, fFin, mainplant),
                    fetchDetalleJornadas(codigo, fIni, fFin, mainplant)
                ]);

                const tareasTec = tareas.filter((t: TareaData) => (t.COD_TECNICO || t.CODIGO_TECNICO) === codigo);
                const jornadasTec = jornadas.filter((j: JornadaRow) => (j.COD_TECNICO || j.CODIGO_TECNICO) === codigo);

                //Agrupar por días entre inicio y fin
                const dias: Array<{ label: string; subLabel: string; tareas: TareaData[]; jornada: JornadaData | null }> = [];
                let curr = new Date(fechaIniAplicada + "T00:00:00");
                const end = new Date(fechaFinAplicada + "T00:00:00");

                while (curr <= end) {
                    const y = curr.getFullYear();
                    const m = curr.getMonth() + 1;
                    const d = curr.getDate();
                    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

                    const tareasDia = tareasTec.filter((t: TareaData) => {
                        if (!t.FECHA_INI) return false;
                        const td = new Date(t.FECHA_INI);
                        return !Number.isNaN(td.getTime()) && td.getFullYear() === y && td.getMonth() + 1 === m && td.getDate() === d;
                    });

                    const jornadaDiaRaw = jornadasTec.find((j: JornadaRow) => {
                        if (typeof j.FECHA_INI !== "string") return false;
                        const jd = new Date(j.FECHA_INI);
                        return !Number.isNaN(jd.getTime()) && jd.getFullYear() === y && jd.getMonth() + 1 === m && jd.getDate() === d;
                    });
                    const jornadaDia = jornadaDiaRaw && typeof jornadaDiaRaw.FECHA_INI === "string" ? {
                        inicio: new Date(jornadaDiaRaw.FECHA_INI),
                        fin: jornadaDiaRaw.FECHA_FIN && typeof jornadaDiaRaw.FECHA_FIN === "string" ? new Date(jornadaDiaRaw.FECHA_FIN) : null
                    } : null;

                    dias.push({
                        label: curr.toLocaleDateString('es-ES', { weekday: 'long' }),
                        subLabel: dateStr,
                        tareas: tareasDia,
                        jornada: jornadaDia
                    });

                    curr.setDate(curr.getDate() + 1);
                }

                setDataPorDia(dias.reverse()); //De más reciente a más antiguo
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setErrorMsg(err.message || "Error cargando detalle");
                } else {
                    setErrorMsg("Error cargando detalle");
                }
            } finally {
                if (!silent) setCargando(false);
            }
        };

        loadDetalle();
        const interval = setInterval(() => loadDetalle(true), 60000);
        return () => clearInterval(interval);
    }, [codigo, mainplant, fechaIniAplicada, fechaFinAplicada]);

    const consultarFechas = () => {
        setFechaIniAplicada(fechaIniInput);
        setFechaFinAplicada(fechaFinInput);
    };

    return (
        <div id="detalle-tecnico-page">
            <header className="detalle-header">
                <div className="detalle-title-container">
                    <h1 className="detalle-title">Registro de Técnico: {tecnicoLabel}</h1>
                </div>

                <div className="detalle-filtros">
                    <div className="filtro-group">
                        <label>Fecha de Inicio:</label>
                        <input type="date" value={fechaIniInput} disabled={cargando} onChange={(e) => setFechaIniInput(e.target.value)} />
                    </div>
                    <div className="filtro-group">
                        <label>Fecha de Fin:</label>
                        <input type="date" value={fechaFinInput} disabled={cargando} onChange={(e) => setFechaFinInput(e.target.value)} />
                    </div>
                    <div className="detalle-acciones">
                        <button className="btn-detalle" onClick={() => navigate("/estadisticas-productividad")}>Estadísticas</button>
                        <button className="btn-detalle btn-primary" onClick={consultarFechas} disabled={cargando}>Consultar fechas</button>
                    </div>
                </div>
            </header>

            {cargando && <Loader />}
            <ErrorMessage message={errorMsg || ""} onClear={() => setErrorMsg(null)} />

            <div className="detalle-lista">
                {dataPorDia.map((dia) => (
                    <div key={dia.subLabel} className="detalle-dia-row">
                        <div className="detalle-dia-info">
                            <span className="dia-label">{dia.label}</span>
                            <span className="dia-sublabel">{dia.subLabel}</span>
                            <span className="dia-minutos">({Math.floor(dia.tareas.reduce((acc: number, t: TareaData) => acc + (t.FECHA_INI && t.FECHA_FIN ? (new Date(t.FECHA_FIN).getTime() - new Date(t.FECHA_INI).getTime()) / 60000 : 0), 0))} min)</span>
                        </div>
                        <div className="detalle-dia-timeline">
                            <LineaTiempoTecnico
                                tec={{ codigo: codigo!, nombre: tecnicoLabel, delegacion: "", mostrar: true }}
                                tareas={dia.tareas}
                                jornada={dia.jornada}
                                handleMouseEnter={handleMouseEnter}
                                handleMouseMove={handleMouseMove}
                                handleMouseLeave={handleMouseLeave}
                                copiarAPortapapeles={copiarAPortapapeles}
                                layout="row"
                                fixedRange={[6, 23]}
                                hideInfo={true}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div id="divHoverRanking" className="divHover" />
            {notificacion && <div className="notificacion-ranking mostrar">{notificacion}</div>}
        </div>
    );
}
  