import {
  getClaseFamilia,
  formatearFechaVisual,
} from "../../config/regionConfig";
import { type MaquinaRetirada } from "../../services/Types";
import { buildIntervencionesArray, construirHover } from "./helpers";

interface Props {
  row: MaquinaRetirada;
  onMouseEnter: (e: React.MouseEvent, text: string) => void;
  onMouseLeave: () => void;
}

export default function FilaEquipo({ row, onMouseEnter, onMouseLeave }: Props) {
  const redisposicion =
    buildIntervencionesArray(row.redisposiciones_text) || {};
  const [familiaText, claseFamilia] = getClaseFamilia(
    row.subfamilia?.slice(0, -3) || "",
    row.tipo_trabajo,
  );

  const nivel = redisposicion.NIVEL?.trim().toLowerCase().replace(/\s+/g, "");
  const esBasico = nivel === "básico";
  const tieneFD = row.redisposiciones_text !== "Sin redisposiciones";

  if (tieneFD && !esBasico) return null;

  const hoverText = construirHover(row, redisposicion);
  const clasesFila = tieneFD ? "básico" : "noFD";

  return (
    <tr
      className={clasesFila}
      onMouseEnter={(e) => onMouseEnter(e, hoverText)}
      onMouseLeave={onMouseLeave}
    >
      <td className={`Machine ${claseFamilia}`}>{familiaText}</td>
      <td className="matricula">{row.matricula}</td>
      <td className="fecha">{formatearFechaVisual(row.fecha_ejecucion)}</td>
    </tr>
  );
}
  