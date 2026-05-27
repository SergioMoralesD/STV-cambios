import { useState, useEffect, useCallback } from "react";
import { fetchSlaSt02 } from "../../../services/trazabilidadService";
import type { SlaSt02Row } from "../../../services/Types";
import { HelpButton, HelpMenu } from "../../../Components/Help/helpmenu";
import Loader from "../../../Components/common/Loader";
import { useTooltip } from "../../../Components/SLAST02/useTooltip";
import { DelegCard } from "../../../Components/SLAST02/DelegCard";
import { SummaryTable } from "../../../Components/SLAST02/SummaryTable";
import type { TooltipHandlers } from "../../../Components/SLAST02/types";
import {
    extraerDelegacionesDesdeMainplant,
    getFamilyColorClass,
} from "../../../config/regionConfig";
import { remoteLog } from "../../../utils/logger";
import "../../../App.css";
import "./SlaSt02Dashboard.css";

// ─── TYPES ────────────────────────────────────────────────────────────────

type FiltroTipo = "ambos" | "equipos" | "cabezales";

// ─── FILTER BUTTONS ───────────────────────────────────────────────────────

interface FiltroButtonsProps {
    filtro: FiltroTipo;
    onChange: (f: FiltroTipo) => void;
}

function FiltroButtons({ filtro, onChange }: FiltroButtonsProps) {
    const opts: { val: FiltroTipo; label: string }[] = [
        { val: "ambos", label: "Ambos" },
        { val: "equipos", label: "Equipos" },
        { val: "cabezales", label: "Cabezales" },
    ];
    return (
        <div className="sla-filtro-wrapper">
            {opts.map((o) => (
                <button
                    key={o.val}
                    className={`sla-filtro-btn${filtro === o.val ? " sla-filtro-btn--active" : ""}`}
                    onClick={() => onChange(o.val)}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────

interface SlaSt02DashboardProps {
    mainplant: string;
}

export default function SlaSt02Dashboard({ mainplant }: SlaSt02DashboardProps) {
    const delegaciones = extraerDelegacionesDesdeMainplant(mainplant);

    const isCanarias = delegaciones.some((d) => d.startsWith("6S"));

    const [allRows, setAllRows] = useState<SlaSt02Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filtro, setFiltro] = useState<FiltroTipo>("ambos");

    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const { tooltip, show, move, hide } = useTooltip();

    const cargarDatos = useCallback(async (silent = false) => {
        if (!mainplant) return;

        if (!silent) setLoading(true);
        setError(null);
        try {
            const data = await fetchSlaSt02(mainplant);
            setAllRows(data);
        } catch (err) {
            console.error(err);
            setError(
                "Se recibio una respuesta de la API erronea. Por favor, recarga la pagina o informa al responsable tecnico.",
            );
        } finally {
            if (!silent) setLoading(false);
        }
    }, [mainplant]);

    useEffect(() => {
        console.debug(`[SlaSt02Dashboard] Effect triggered. mainplant: "${mainplant}"`);
        if (!mainplant) {
            console.debug("[SlaSt02Dashboard] No mainplant, skipping fetch.");
            setLoading(false);
            return;
        }

        cargarDatos();
        const interval = setInterval(() => {
            cargarDatos(true);
        }, 60_000);
        remoteLog(`SlaSt02Dashboard: ${mainplant}`, { level: 'INFO', context: 'SlaSt02Dashboard' });
        return () => clearInterval(interval);
    }, [mainplant, cargarDatos]);

    // Aplicar filtro igual que en la referencia
    const rows =
        filtro === "equipos"
            ? allRows.filter((r) => r.TIPO_FAMILIA !== "CA")
            : filtro === "cabezales"
                ? allRows.filter((r) => r.TIPO_FAMILIA === "CA")
                : allRows;

    const tooltipHandlers: TooltipHandlers = {
        onMouseEnter: show,
        onMouseMove: move,
        onMouseLeave: hide,
    };

    return (
        <>
            <div className="sla-dashboard fondo-escritorio">

                <HelpButton onClick={() => setIsHelpOpen(true)} />

                {loading ? (
                    <Loader />
                ) : error ? (
                    <div className="sla-error-box">{error}</div>
                ) : (
                    <>

                        <div className="sla-cards-row">
                            {delegaciones.map((deleg) => (
                                <DelegCard
                                    key={deleg}
                                    deleg={deleg}
                                    rows={rows}
                                    isCanarias={isCanarias}
                                    tooltipHandlers={tooltipHandlers}
                                />
                            ))}
                        </div>

                        <div className="sla-bottom-bar">
                            <SummaryTable
                                delegaciones={delegaciones}
                                allRows={rows}
                                getFamilyColorClass={getFamilyColorClass}
                            />
                            <FiltroButtons filtro={filtro} onChange={setFiltro} />
                        </div>
                    </>
                )}
            </div>

            {tooltip.visible && (
                <div
                    className="custom-tooltip"
                    style={{ top: tooltip.y + 20, left: tooltip.x + 15 }}
                >
                    {tooltip.text}
                </div>
            )}
            <HelpMenu
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                subView="slast02"
            />
        </>
    );
}
  