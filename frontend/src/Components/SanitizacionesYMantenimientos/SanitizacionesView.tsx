import type { Sanitizacion, AvisoLimpieza } from "../../services/Types";
import { ISLA_IMG, ISLA_NOMBRE } from "../../services/helpers";
import { SanitizacionRow, AvisoRow } from "./SanitizacionesRow";
import { IslaCard } from "../common/IslaCard";
import { useState, useCallback } from "react";
import "../../Pages/menuB2B/SanitizacionesYMantenimientos/SanitizacionesYMantenimientos.css";

interface Props {
    sanitizaciones: Sanitizacion[];
    avisos: AvisoLimpieza[];
    loading: boolean;
    error: string | null;
    columnas: string[];
}

interface Notificacion {
    mensaje: string;
    color: string;
    id: number;
}

export default function SanitizacionesView({
    sanitizaciones,
    avisos,
    loading,
    error,
    columnas,
}: Props) {
    const [notif, setNotif] = useState<Notificacion | null>(null);

    const handleNotify = useCallback((msg: string, color: string) => {
        const id = Date.now();
        setNotif({ mensaje: msg, color, id });
        setTimeout(() => setNotif((n) => (n?.id === id ? null : n)), 2800);
    }, []);

    if (error) {
        return <div className="maint-error">{error}</div>;
    }

    return (
        <div className="maint-main">
            <div className="maint-tables-row">
                {columnas.map((idIsla) => {
                    // Filtrar datos de esta isla
                    const saniIsla = sanitizaciones.filter(
                        (s) => s.DELEGACION?.trim() === idIsla,
                    );
                    const avisosIsla = avisos.filter(
                        (a) => a.DELEGACION?.trim() === idIsla,
                    );

                    // Contar repeticiones de cliente para las sanitizaciones
                    const clienteCount = saniIsla.reduce<Record<string, number>>(
                        (acc, item) => {
                            acc[item.CLIENTE] = (acc[item.CLIENTE] || 0) + 1;
                            return acc;
                        },
                        {},
                    );

                    const contador = saniIsla.length + avisosIsla.length;

                    return (
                        <IslaCard
                            key={idIsla}
                            containerClassName="maint-col-isla"
                            tableClassName="maint-table"
                            headerFlexDirection="row"
                            customHeaderContent={
                                <>
                                    <img
                                        className="maint-isla-img"
                                        src={`./img/${ISLA_IMG[idIsla]}.png`}
                                        alt={ISLA_NOMBRE[idIsla]}
                                    />
                                    <span>
                                        {ISLA_NOMBRE[idIsla]} ({contador})
                                    </span>
                                </>
                            }
                            data={[...saniIsla, ...avisosIsla]}
                        >
                            <tbody className="maint-body">
                                {saniIsla.map((item, idx) => (
                                    <SanitizacionRow
                                        key={`${item.AVISO}-${idx}`}
                                        item={item}
                                        clienteCount={clienteCount[item.CLIENTE] ?? 1}
                                        onNotify={handleNotify}
                                    />
                                ))}
                                {avisosIsla.map((item, idx) => (
                                    <AvisoRow
                                        key={`aviso-${idx}`}
                                        item={item}
                                        onNotify={handleNotify}
                                    />
                                ))}
                            </tbody>
                        </IslaCard>
                    );
                })}
            </div>

            {/* Toast de notificación */}
            {notif && (
                <div
                    className="maint-notificacion maint-notificacion--visible"
                    style={{ backgroundColor: notif.color }}
                >
                    {notif.mensaje}
                </div>
            )}
        </div>
    );
}
  