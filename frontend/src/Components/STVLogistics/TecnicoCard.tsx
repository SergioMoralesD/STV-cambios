import TablaResumenLogistica from "./TablaResumenLogistica";
import MedidoresCocacola from "../MedidoresCocacola/MedidoresCocacola";
import Loader from "../common/Loader";
import { IslaCard } from "../common/IslaCard";
import HoverTooltip from "../common/HoverTooltip";
import type {
    AveriaActividad,
    IslaData,
    RecuentoEstado,
    AllMetricas
} from "../../services/Types";
import {
    getEnhancedFamily,
    getDiffColor,
    getFechaLogisticsClass,
} from "../../services/commonLogic";
import { getImg, ISLA_NOMBRE } from "./STVLogisticsUtils";
import "./STVLogistics.css";
import "../../App.css";


interface FilaAveriaProps {
    av: AveriaActividad;
    index: number;
}

function FilaAveria({ av, index }: FilaAveriaProps) {
    const tooltipContent = (
        <div className="tooltip-inner">
            <div className="tooltip-title">{av.AVISO || "Sin Aviso"}</div>
            <hr className="tooltip-divider" />
            <div className="tooltip-body">
                <div className="tooltip-record">
                    {av.FECHA_PLANIFICADA && <div className="tooltip-date">· {av.FECHA_PLANIFICADA.substring(0, 10)}</div>}
                    <div className="tooltip-desc" style={{ marginTop: '5px' }}>{av.CLIENTE}</div>
                    <div className="tooltip-intervention">
                        <div className="tooltip-tech">Tipo: {av.TIPO}</div>
                    </div>
                </div>
            </div>
        </div>
    );

    const [familiaLabel, familiaClass] = getEnhancedFamily(av.FAMILIA, av.TIPO, av.MATERIAL);

    return (
        <HoverTooltip content={tooltipContent}>
            <tr
                className="trTbody"
                style={{ cursor: "default" }}
            >
                <td
                    className={`family-icon-cell ${familiaClass}`}
                >
                    {familiaLabel}
                </td>
                <td className={getDiffColor(av.DIFERENCIA)}>
                    {av.TIPO} - {av.AVISO} - {av.CLIENTE}
                </td>
                <td className={getFechaLogisticsClass(av.FECHA_PLANIFICADA, av.DIFERENCIA2)}>
                    {av.FECHA_PLANIFICADA ? av.FECHA_PLANIFICADA.substring(0, 10) : "S/P"}
                </td>
            </tr>
        </HoverTooltip>
    );
}

interface TablaIslaProps {
    fili: string;
    averias: AveriaActividad[];
}

export function TablaIsla({ fili, averias }: TablaIslaProps) {
    const nombre = ISLA_NOMBRE[fili] || fili;
    const imgCode = getImg(fili);

    return (
        <IslaCard
            layout="custom"
            containerClassName="col-isla-logistics"
            cardClassName="isla-table-wrapper"
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
                        {averias.map((av, index) => (
                            <FilaAveria key={index} av={av} index={index} />
                        ))}
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

interface STVLogisticsTextoProps {
    mainplants: string[];
    averias: AveriaActividad[];
    recuentos: RecuentoEstado[];
    metricas: AllMetricas;
    tiemposAnio: Record<string, IslaData>;
    tiemposMes: Record<string, IslaData>;
    loading: boolean;
}

export function STVLogisticsTexto({
    mainplants,
    averias,
    recuentos,
    metricas,
    tiemposAnio,
    tiemposMes,
    loading,
}: STVLogisticsTextoProps) {
    if (loading) {
        return <Loader />;
    }
    return (
        <div className="logistics-dashboard">
            <div className="row-islas">
                {mainplants.map((fili) => (
                    <TablaIsla
                        key={fili}
                        fili={fili}
                        averias={averias.filter(
                            (a) =>
                                a.DELEG?.toUpperCase() === fili.toUpperCase() &&
                                a.USERSTATUS !== "E0011" &&
                                a.USERSTATUS !== "E0012"
                        )}
                    />
                ))}
            </div>
            <div className="logistics-footer">
                <TablaResumenLogistica
                    mainplants={mainplants}
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
  