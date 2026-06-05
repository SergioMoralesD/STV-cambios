import React from "react";
import { IslaCard } from "../common/IslaCard";
import TrabajoClienteCard from "./TrabajoClienteCard";
import type { ColumnaIsla } from "../../services/Types";
import "../../Pages/menuB2B/TrabajoCliente/TrabajoCliente.css";

interface Props {
    averias: any[];
    loading: boolean;
    columnas: ColumnaIsla[];
}

const TrabajoClienteDashboardTexto: React.FC<Props> = ({
    averias,
    loading,
    columnas,
}) => {
    if (loading && averias.length === 0) {
        return null;
    }

    return (
        <div className="trabajo-cliente-main-container">
            <div className="row-tables">
                {columnas.map((col) => {
                    const filteredAverias = averias.filter((a) =>
                        col.mainplant.split("-").includes(a.DELEGACION || a.delegacion || "")
                    );

                    // Conteo de filas por CLIENTE
                    const clientCounts: Record<string, number> = {};
                    filteredAverias.forEach(a => {
                        const cli = a.CLIENTE || "";
                        clientCounts[cli] = (clientCounts[cli] || 0) + 1;
                    });

                    return (
                        <IslaCard
                            key={col.id}
                            containerClassName="col-isla"
                            cardClassName="cards-container"
                            bodyClassName="tc-card-body"
                            layout="custom"
                            useRegionClass={false}
                            headerClassName="tc-sticky-header"
                            headerFlexDirection="row"
                            showHeaderLabels={false}
                            customHeaderContent={
                                <>
                                    <img
                                        src={`/img/${col.img}.png`}
                                        alt={col.label}
                                        className="logo-isla"
                                    />
                                    <span>
                                        {col.label} ({filteredAverias.length})
                                    </span>
                                </>
                            }
                            data={filteredAverias}
                            renderRow={(av: any) => (
                                <TrabajoClienteCard
                                    key={`${av.codigo}-${Math.random()}`}
                                    averia={av}
                                    count={clientCounts[av.CLIENTE || ""]}
                                />
                            )}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default TrabajoClienteDashboardTexto;
  