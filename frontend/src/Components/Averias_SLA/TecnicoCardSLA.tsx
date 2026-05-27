import { getClaseFamilia } from "../../config/regionConfig";
import { type AveriaSLA } from "../../services/Types";
import { formatDuration, getSLAColor } from "../../services/commonLogic";

export default function TecnicoCardSLA({ averia }: { averia: AveriaSLA }) {
    const [sigla, claseFamilia] = getClaseFamilia(
        averia.FAMILIA,
        averia.TIPO_AVISO,
    );
    const colorRow = getSLAColor(averia.SLA, averia.USERSTATUS, averia.CODEACTIVITY ?? undefined);

    // Quitar 3+ ceros iniciales del aviso (igual que el JS original)
    const codAviso = averia.AVISO
        ? String(averia.AVISO).replace(/^0{3,}/, "")
        : "";

    // TIME_PAUSA si existe, si no TIME
    const formatMinutosSLA = (mins: number | null | undefined) => {
        if (mins == null) return "0d 0h";
        const m = Math.abs(Math.round(mins));
        const d = Math.floor(m / 1440);
        const h = Math.floor((m % 1440) / 60);
        const sign = (mins || 0) < 0 ? "-" : "";
        return `${sign}${d}d ${h}h`;
    };

    const timePausa = averia.TIME_PAUSA ?? averia.TIME;
    const tiempoStr = `${formatMinutosSLA(averia.TIME)} (${formatMinutosSLA(timePausa)})`;

    // Normalizar separador ';' en cliente
    let cliente = averia.CLIENTE || "";
    if (cliente.includes(";")) {
        const palabras = cliente.split(";");
        cliente =
            palabras
                .slice(0, -1)
                .map((p: string) => p.trim() + "; ")
                .join("") + palabras[palabras.length - 1].trim();
    }

    return (
        <tr className={colorRow}>
            <td className={`Machine ${claseFamilia}`}>{sigla}</td>
            <td className="avisTD">{codAviso}</td>
            <td className="cliTD">{cliente}</td>
            <td className="tecTD">{averia.TECNICO || ""}</td>
            <td className="TimeTD">{tiempoStr}</td>
        </tr>
    );
}  