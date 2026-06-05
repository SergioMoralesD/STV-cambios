import type { Sanitizacion, AvisoLimpieza } from "../../services/Types";
import { formatearFechaVisual } from "../../config/regionConfig";
import HoverTooltip from "../common/HoverTooltip";

// ─── Lógica de color (idéntica al original) ────────────────────────────────

function getColor(
    año: number,
    diferencia: number,
    tipo: string,
): [string, string] {
    const currentYear = new Date().getFullYear();
    const isZFF = año === currentYear && tipo === "ZFF";

    if (diferencia > 10)
        return ["verde", isZFF ? "yellow" : "white"];
    if (diferencia > 5)
        return ["amarillo", isZFF ? "yellow" : "black"];
    if (diferencia >= 0)
        return ["rojo", isZFF ? "yellow" : "white"];
    return ["negro", isZFF ? "yellow" : "white"];
}

// ─── Helpers de portapapeles ───────────────────────────────────────────────

async function copiarPortapapeles(
    text: string,
    onNotify: (msg: string, color: string) => void,
) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.style.position = "absolute";
            ta.style.left = "-999999px";
            document.body.prepend(ta);
            ta.select();
            try {
                document.execCommand("copy");
            } finally {
                ta.remove();
            }
        }
        onNotify(`${text} copiado al portapapeles`, "rgba(27,27,27,0.9)");
    } catch {
        onNotify("No se ha podido copiar al portapapeles", "rgba(255,0,0,0.9)");
    }
}

// ─── Fila de sanitización ──────────────────────────────────────────────────

interface SanitizacionRowProps {
    item: Sanitizacion;
    clienteCount: number;
    onNotify: (msg: string, color: string) => void;
}

export function SanitizacionRow({
    item,
    clienteCount,
    onNotify,
}: SanitizacionRowProps) {
    const año = Number(item.AÑO || 0);
    const diferencia = Number(item.DIFERENCIA || 0);
    const tipo = item.TIPO || "";
    
    const [fondoClass, letraColor] = getColor(año, diferencia, tipo);
    const countText = clienteCount > 1 ? ` (${clienteCount})` : "";
    const tooltipContent = (
        <div className="tooltip-inner">
            <div className="tooltip-title">{item.AVISO || "Sin Aviso"}</div>
            <hr className="tooltip-divider" />
            <div className="tooltip-body">
                <div className="tooltip-record">
                    <div className="tooltip-desc">{item.EQUIPO || "Equipo"}</div>
                </div>
            </div>
        </div>
    );

    return (
        <tr
            onClick={() => copiarPortapapeles(item.AVISO, onNotify)}
            style={{ cursor: "pointer" }}
        >
            <td
                className={`fondo-${fondoClass}`}
                style={{ color: letraColor }}
            >
                <HoverTooltip content={tooltipContent}>
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.TIPO || "S"} - {item.CLIENTE || "Cliente"}
                        {countText}
                    </div>
                </HoverTooltip>
            </td>
        </tr>
    );
}

// ─── Fila de aviso de limpieza ─────────────────────────────────────────────

interface AvisoRowProps {
    item: AvisoLimpieza;
    onNotify: (msg: string, color: string) => void;
}

export function AvisoRow({ item, onNotify }: AvisoRowProps) {
    const rawFecha = item.FECHA_LIMPIEZA || item.FECHA || "";
    const fechaFormateada = formatearFechaVisual(rawFecha).replace(/-/g, "/");
    const tooltipContent = (
        <div className="tooltip-inner">
            <div className="tooltip-title">{item.TIPO_LIMPIEZA || "Limpieza"}</div>
            <hr className="tooltip-divider" />
            <div className="tooltip-body">
                <div className="tooltip-record">
                    <div className="tooltip-desc">{item.EQUIPO || "Equipo"}</div>
                </div>
            </div>
        </div>
    );

    return (
        <tr
            onClick={() => copiarPortapapeles(item.EQUIPO, onNotify)}
            style={{ cursor: "pointer" }}
        >
            <td className="gris">
                <HoverTooltip content={tooltipContent}>
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {fechaFormateada} - {item.CLIENTE}
                    </div>
                </HoverTooltip>
            </td>
        </tr>
    );
}
  