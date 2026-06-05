// src/webs/FAEquiposInstalados/FilaEquipo.tsx
import { useState } from "react";
import {
  getClaseFamilia,
  formatearFechaVisual,
} from "../../config/regionConfig";
import type { FAEquipo } from "../../services/Types";
import { construirHover } from "./textParse";

interface Props {
  row: FAEquipo;
  onMouseEnter: (e: React.MouseEvent, text: string) => void;
  onMouseLeave: () => void;
}

export function FilaEquipo({ row, onMouseEnter, onMouseLeave }: Props) {
  const [familiaText, claseFamilia] = getClaseFamilia(
    row.subfamilia?.slice(0, -3) || "",
    row.tipo_trabajo,
  );
  const [now] = useState(() => Date.now());
  const reciente =
    now - new Date(row.fecha_ejecucion).getTime() <= 604800000;
  const hoverText = construirHover(row);

  return (
    <tr
      className={reciente ? "ultimaSemana" : ""}
      onMouseEnter={(e) => onMouseEnter(e, hoverText)}
      onMouseLeave={onMouseLeave}
    >
      <td className={`Machine ${claseFamilia}`}>{familiaText}</td>
      <td className="matricula">{row.matricula}</td>
      <td className="modelo">{row.modelo}</td>
      <td className="fecha">{formatearFechaVisual(row.fecha_ejecucion)}</td>
    </tr>
  );
}
  