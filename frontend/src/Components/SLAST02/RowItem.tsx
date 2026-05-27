import type { MouseEvent } from "react";
import { getClaseFamilia } from "../../config/regionConfig";
import type { SlaSt02Row } from "../../services/Types";
import { getMessage } from "./helpers";

// ─── ROW ITEM ─────────────────────────────────────────────────────────────

interface RowItemProps {
  row: SlaSt02Row;
  colorClass: string;
  redisposicionClass: string;
  onMouseEnter: (text: string, x: number, y: number) => void;
  onMouseMove: (x: number, y: number, text: string) => void;
  onMouseLeave: () => void;
}

export function RowItem({
  row,
  colorClass,
  redisposicionClass,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
}: RowItemProps) {
  const subfamilia = row.SUBFAMILIA?.slice(0, -3) ?? "";
  const [familiaText, claseFamilia] = getClaseFamilia(
    subfamilia,
    row.TIPO_AVISO,
  );

  return (
    <div
      className={`sla-row-item ${colorClass}`}
      onMouseEnter={(e: MouseEvent) =>
        onMouseEnter(getMessage(row), e.clientX, e.clientY)
      }
      onMouseMove={(e: MouseEvent) =>
        onMouseMove(e.clientX, e.clientY, getMessage(row))
      }
      onMouseLeave={onMouseLeave}
    >
      <div className={`sla-cell-tipo ${claseFamilia}`}>{familiaText}</div>
      <div className="sla-cell-info">
        {row.MODELO} - {row.MATRICULA}
      </div>
      <div className={`sla-cell-redisposicion ${redisposicionClass}`} />
    </div>
  );
}

  