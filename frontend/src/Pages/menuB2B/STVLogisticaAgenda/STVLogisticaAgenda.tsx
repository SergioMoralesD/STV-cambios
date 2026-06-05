import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { fetchLogisticsFull } from "../../../services/stvlogistics";
import { useAuth } from "../../../Context/AuthContext";
import { useSelection } from "../../../Context/SelectionContext";
import { remoteLog } from "../../../utils/logger";
import HoverTooltip from "../../../Components/common/HoverTooltip";
import type {
    AllMetricas,
    AveriaActividad,
    IslaData,
    RecuentoEstado,
} from "../../../services/Types";
import { HelpButton, HelpMenu } from "../../../Components/Help/helpmenu";
import {
    obtenerDelegacionesVista,
    obtenerRegionActual,
    resolverMainplant,
    obtenerNombreIsla,
} from "../../../config/regionConfig";
import {
    getEnhancedFamily,
    getDiffColor,
    getFechaLogisticsClass,
} from "../../../services/commonLogic";
import { getImg, ISLA_NOMBRE } from "../../../Components/STVLogistics/STVLogisticsUtils";
import { copyToClipboard } from "../../../Components/averias/datosAviso";
import { IslaCard } from "../../../Components/common/IslaCard";
import { AgendaSemanal } from "../../../Components/common/AgendaSemanal";
import TablaResumenLogistica from "../../../Components/STVLogistics/TablaResumenLogistica";
import MedidoresCocacola from "../../../Components/MedidoresCocacola/MedidoresCocacola";
import Loader from "../../../Components/common/Loader";
import "../../../Components/STVLogistics/STVLogistics.css";
import "./stvLogisticaAgenda.css";

// ─── Tarjeta de avería para la columna de la agenda ──────────────────────────

function AgendaAveriaCard({ av }: { av: AveriaActividad }) {
    const [familiaLabel, familiaClass] = getEnhancedFamily(
        av.FAMILIA,
        av.TIPO,
        av.MATERIAL
    );

    const handleClick = (e: React.MouseEvent) => {
        // En click izquierdo, copiamos el aviso
        if (e.button === 0) {
            copyToClipboard(av.AVISO);
        }
    };

    return (
        <div 
            className={`agenda-averia-card ${familiaClass}`} 
            onClick={handleClick}
            style={{ cursor: "pointer" }}
            title="Click para copiar aviso"
        >
            <span className="agenda-familia-badge">{familiaLabel}</span>
            <span className="agenda-averia-text">
                {av.TIPO} – {av.AVISO}
            </span>
            <span className="agenda-cliente-text">{av.CLIENTE}</span>
        </div>
    );
}

// ─── Tabla de isla (panel izquierdo) ─────────────────────────────────────────

function TablaIsla({
    fili,
    averias,
}: {
    fili: string;
    averias: AveriaActividad[];
}) {
    const nombre = ISLA_NOMBRE[fili] || fili;
    const imgCode = getImg(fili);

    return (
        <IslaCard
            layout="custom"
            containerClassName="col-isla-logistics"
            cardClassName="isla-table-wrapper"
            bodyClassName="isla-card-body-flex"
            customHeaderContent={
                <div className="header-fili-logistics">
                    <img src={`./img/${imgCode}.png`} className="islas" alt="" />
                    <span className="ms-2">
                        {nombre} ({averias.length})
                    </span>
                </div>
            }
        >
            <div className="tabla-body-scroll">
                <table className="tableElements">
                    <tbody>
                        {averias.map((av, i) => {
                            const [familiaLabel, familiaClass] = getEnhancedFamily(
                                av.FAMILIA,
                                av.TIPO,
                                av.MATERIAL
                            );
                            const tooltipTexto = [
                                `AVISO: ${av.AVISO}`,
                                `CLIENTE: ${av.CLIENTE}`,
                                `TIPO: ${av.TIPO}`,
                                av.FECHA_PLANIFICADA
                                    ? `FECHA: ${av.FECHA_PLANIFICADA.substring(0, 10)}`
                                    : "",
                            ]
                                .filter(Boolean)
                                .join("\n");

                            return (
                                <HoverTooltip key={i} content={tooltipTexto}>
                                    <tr
                                        className="trTbody"
                                        style={{ cursor: "default" }}
                                    >
                                        <td className={`family-icon-cell ${familiaClass}`}>
                                            {familiaLabel}
                                        </td>
                                        <td className={getDiffColor(av.DIFERENCIA)}>
                                            {av.TIPO} - {av.AVISO} - {av.CLIENTE}
                                        </td>
                                        <td className={getFechaLogisticsClass(av.FECHA_PLANIFICADA, av.DIFERENCIA2)}>
                                            {av.FECHA_PLANIFICADA
                                                ? av.FECHA_PLANIFICADA.substring(0, 10)
                                                : "S/P"}
                                        </td>
                                    </tr>
                                </HoverTooltip>
                            );
                        })}
                        {averias.length === 0 && (
                            <tr>
                                <td colSpan={3} className="sin-avisos">
                                    Sin avisos
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </IslaCard>
    );
}

// ─── Dashboard interior ───────────────────────────────────────────────────────

interface AgendaDashboardInnerProps {
    mainplant: string;
    averias: AveriaActividad[];
    recuentos: RecuentoEstado[];
    metricas: AllMetricas;
    tiemposAnio: Record<string, IslaData>;
    tiemposMes: Record<string, IslaData>;
    loading: boolean;
}

function AgendaDashboardInner({
    mainplant,
    averias,
    recuentos,
    metricas,
    tiemposAnio,
    tiemposMes,
    loading,
}: AgendaDashboardInnerProps) {
    if (loading) return <Loader />;

    const averiasActivas = averias.filter(
        (a) => a.USERSTATUS !== "E0011" && a.USERSTATUS !== "E0012"
    );

    return (
        <div className="agenda-dashboard">
            {/* Fila superior: tablas de islas (izq) + agenda semanal (dcha) */}
            <div className="agenda-top-row">
                {/* Panel izquierdo con la isla seleccionada */}
                <div className="agenda-islas-panel">
                    <div className="row-islas">
                        <TablaIsla
                            fili={mainplant}
                            averias={averiasActivas.filter(
                                (a) => a.DELEG?.toUpperCase() === mainplant.toUpperCase()
                            )}
                        />
                    </div>
                </div>

                {/* Agenda semanal para la isla seleccionada */}
                <AgendaSemanal<AveriaActividad>
                    items={averiasActivas.filter(
                        (a) => a.DELEG?.toUpperCase() === mainplant.toUpperCase()
                    )}
                    getDateKey={(av) => av.FECHA_PLANIFICADA}
                    renderItem={(av, i) => <AgendaAveriaCard key={i} av={av} />}
                />
            </div>

            {/* Footer: tabla resumen + medidores */}
            <div className="logistics-footer">
                <TablaResumenLogistica
                    mainplants={[mainplant]}
                    tiemposAnio={tiemposAnio}
                    tiemposMes={tiemposMes}
                    recuentos={recuentos}
                />
                <MedidoresCocacola
                    metricas={metricas}
                    loading={loading || !metricas}
                    isLogistics={true}
                />
            </div>
        </div>
    );
}

// ─── Página principal (permisos + carga de datos) ─────────────────────────────

interface STVLogisticaAgendaProps {
    mps?: string;
}

export default function STVLogisticaAgenda({ mps: _mps }: STVLogisticaAgendaProps) {
    const { user } = useAuth();
    const { selectedRegion, selectedDelegations } = useSelection();
    const navigate = useNavigate();

    const regionCode = useMemo(
        () => obtenerRegionActual(selectedRegion, user?.regiones),
        [selectedRegion, user?.regiones]
    );

    const allowed = useMemo(
        () => obtenerDelegacionesVista(user?.delegaciones, regionCode, "STVLOG"),
        [user?.delegaciones, regionCode]
    );

    const mainplantParam = useMemo(() => {
        const resolved = resolverMainplant({
            seleccion: selectedDelegations,
            permitidas: allowed,
            modo: "filtrado",
            devolverNullSinPermitidas: true,
        });

        if (
            resolved === null &&
            selectedDelegations &&
            selectedDelegations !== "C" &&
            selectedDelegations !== "B"
        ) {
            remoteLog(
                `ACCESO DENEGADO (STVLOG-AGENDA): Intento no autorizado de ${user?.usuario} a ${selectedDelegations}`,
                { level: "WARN", context: "STVLogisticaAgenda" }
            );
        }

        return resolved;
    }, [selectedDelegations, allowed, user?.usuario]);

    const mainplants = useMemo(() => {
        if (mainplantParam === null) return null;
        const parts = (mainplantParam ? mainplantParam.split("-") : []).filter(Boolean);
        return parts;
    }, [mainplantParam]);

    useEffect(() => {
        if (mainplants === null) navigate("/hub");
    }, [mainplants, navigate]);

    const mainplantStr = mainplants?.join("-") || "";
    const hasAccess = mainplants !== null;

    const [data, setData] = useState<{
        averias: AveriaActividad[];
        recuentos: RecuentoEstado[];
    }>({ averias: [], recuentos: [] });
    const [metricas, setMetricas] = useState<AllMetricas | null>(null);
    const [tiemposAnio, setTiemposAnio] = useState<Record<string, IslaData>>({});
    const [tiemposMes, setTiemposMes] = useState<Record<string, IslaData>>({});
    const [loading, setLoading] = useState(true);

    // Isla activa para visualización por separado
    const [activeIsla, setActiveIsla] = useState<string | null>(null);

    useEffect(() => {
        if (mainplants && mainplants.length > 0 && !activeIsla) {
            setActiveIsla(mainplants[0]);
        } else if (mainplants && activeIsla && !mainplants.includes(activeIsla)) {
            setActiveIsla(mainplants[0]);
        }
    }, [mainplants, activeIsla]);

    // Auto-escala
    const innerRef = useRef<HTMLDivElement>(null);

    // const calcScale = useCallback(() => {
    //     const el = innerRef.current;
    //     if (!el) return;

    //     if (window.innerWidth <= 1500) {
    //         el.style.transform = "none";
    //         el.style.position = "static";
    //         el.style.top = "auto";
    //         el.style.left = "auto";
    //         return;
    //     }

    //     el.style.position = "absolute";
    //     el.style.top = "0";
    //     el.style.left = "0";
    //     el.style.transform = "scale(1)";
    //     void el.offsetHeight;

    //     const child = el.firstElementChild as HTMLElement | null;
    //     if (!child) return;
    //     const { width, height } = child.getBoundingClientRect();
    //     if (!width || !height) return;
    //     const s = Math.min(window.innerWidth / width, window.innerHeight / height, 1);
    //     el.style.transform = `scale(${s})`;
    // }, []);

    // useEffect(() => {
    //     if (!loading) setTimeout(calcScale, 150);
    // }, [loading, calcScale]);

    // useEffect(() => {
    //     window.addEventListener("resize", calcScale);
    //     return () => window.removeEventListener("resize", calcScale);
    // }, [calcScale]);

    // Carga de datos — misma función que STVLogistics
    const loadData = useCallback(
        async (silent = false) => {
            if (!silent) setLoading(true);
            try {
                const res = await fetchLogisticsFull(mainplantStr);
                setData(res.logistics);
                setMetricas(res.metricas);
                setTiemposAnio(res.metricas.tiemposAnio || {});
                setTiemposMes(res.metricas.tiemposMes || {});
            } catch (err) {
                console.error("Error cargando STVLogisticaAgenda:", err);
            } finally {
                setLoading(false);
            }
        },
        [mainplantStr]
    );

    useEffect(() => {
        if (!hasAccess) return;
        loadData();
        const id = setInterval(() => loadData(true), 60_000);
        return () => clearInterval(id);
    }, [loadData, hasAccess]);

    const [isHelpOpen, setIsHelpOpen] = useState(false);

    if (!hasAccess) return null;
    if (!loading && !metricas) {
        return (
            <div className="error-container">
                <p>Error cargando los datos. Por favor, inténtelo de nuevo.</p>
                <button
                    onClick={() => {
                        setLoading(true);
                        loadData();
                    }}
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="logistics-scale-wrapper">
            <HelpButton onClick={() => setIsHelpOpen(true)} />
            <button 
                className="back-button-fixed"
                onClick={() => navigate('/cordinacion')}
                title="Volver al Menú"
            >
                <img src="/img/Back_blue.png" alt="Volver" style={{ width: '30px', height: 'auto' }} />
            </button>
            <HelpMenu
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                subView="logistica"
            />
            <div
                ref={innerRef}
                className="logistics-scale-inner"
            >
                {/* Selector de islas */}
                {mainplants && mainplants.length > 1 && (
                    <div className="isla-selector-tabs">
                        {mainplants.map((fili) => {
                            const href = `/stvlogisticaagenda?mps=${fili}`;
                            const handleClick = (e: React.MouseEvent) => {
                                if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                                    e.preventDefault();
                                    setActiveIsla(fili);
                                }
                            };

                            return (
                                <a
                                    key={fili}
                                    href={href}
                                    className={`isla-tab-button ${activeIsla === fili ? "active" : ""}`}
                                    onClick={handleClick}
                                >
                                    {obtenerNombreIsla(fili, true)}
                                </a>
                            );
                        })}
                    </div>
                )}

                {activeIsla && (
                    <AgendaDashboardInner
                        mainplant={activeIsla}
                        averias={data.averias}
                        recuentos={data.recuentos}
                        metricas={metricas!}
                        tiemposAnio={tiemposAnio}
                        tiemposMes={tiemposMes}
                        loading={loading}
                    />
                )}
            </div>
        </div>
    );
}
  