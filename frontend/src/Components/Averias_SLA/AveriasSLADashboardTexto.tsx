import type { AllMetricas, AveriaSLA } from "../../services/Types";
import type { ColumnaIsla } from "../../services/Types";
import MedidoresCocacola from "../MedidoresCocacola/MedidoresCocacola";
import TecnicoCardSLA from "./TecnicoCardSLA";
import { IslaCard } from "../common/IslaCard";
import "../../Pages/menuB2B/Averias_SLA/Averias_SLA.css";

interface Props {
    metricas: AllMetricas | null;
    averias: AveriaSLA[];
    loading: boolean;
    columnas: ColumnaIsla[];
}

const AveriasSLADashboardTexto: React.FC<Props> = ({
    metricas,
    averias,
    loading,
    columnas,
}) => {
    // El Loader se maneja en el componente padre (AveriasSLAPage)
    
    if (loading && averias.length === 0) {
        return null; 
    }


    return (
        <div className="dashboard-sla-main-container">
            <div className="row-tables">
                {columnas.map((col) => {
                    const filteredAverias = averias.filter((a) =>
                        col.mainplant.split("-").includes(a.delegacion || "")
                    );

                    return (
                        <IslaCard
                            key={col.id}
                            containerClassName="col-isla"
                            tableClassName="table-isla"
                            headers={[
                                { label: "Fam" },
                                { label: "Aviso" },
                                { label: "Cliente" },
                                { label: "Tecnico" },
                                { label: "Time" }
                            ]}
                            useRegionClass={false}
                            headerFlexDirection="row"
                            showHeaderLabels={false}

                            customHeaderContent={
                                <>
                                    <img
                                        src={`/img/${col.img}.png`}
                                        alt={col.label}
                                        className="logo-isla"
                                    />
                                    {col.label}
                                </>
                            }
                            data={filteredAverias}
                            renderRow={(av: AveriaSLA) => (
                                <TecnicoCardSLA key={av.codigo} averia={av} />
                            )}
                        />
                    );
                })}
            </div>

            <footer className="footer-sla">
                <div className="leyenda-familias">
                    <table>
                        <tbody>
                            <tr className="trLeyenda">
                                <td className="leyenda">
                                    <div className="colorBotellero">B</div> Botellero
                                </td>
                                <td className="leyenda">
                                    <div className="colorVitrina">V</div> Vitrina
                                </td>
                                <td className="leyenda">
                                    <div className="colorVending">VE</div> Vending
                                </td>
                                <td className="leyenda">
                                    <div className="colorDispensing">D</div> Dispensing
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="medidores-wrapper">
                    {metricas && <MedidoresCocacola metricas={metricas} loading={loading} isSLA={true} />}
                </div>
            </footer>
        </div>
    );
};

export default AveriasSLADashboardTexto;  