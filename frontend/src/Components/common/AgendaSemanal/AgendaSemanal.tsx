/**
 * AgendaSemanal — Componente de agenda semanal genérico y reutilizable.
 */

import React, { useMemo, useState } from "react";
import {
  getWeekRangeForOffset,
  getWeekDays,
  toISODateStr,
  formatVisual,
} from "./helpers";
import "./AgendaSemanal.css";

// ─── Tipos ────────────────────────────────────────────────────────────────────

const DIAS_NOMBRE = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES"] as const;

export interface AgendaSemanalProps<T> {
  /** Lista de ítems a distribuir en la agenda por día */
  items: T[];

  /**
   * Extrae la fecha ISO (YYYY-MM-DD...) de cada ítem.
   * Si devuelve null/undefined/vacío, el ítem no aparece en la agenda.
   */
  getDateKey: (item: T) => string | null | undefined;

  /**
   * Render personalizado de cada ítem dentro de su columna de día.
   * Recibe el ítem y su índice dentro de ese día.
   */
  renderItem: (item: T, index: number) => React.ReactNode;

  /**
   * Offset de semana en modo controlado (el padre lo gestiona).
   * Si se omite, el componente usa su propio estado interno.
   */
  weekOffset?: number;

  /** Callback para modo controlado. */
  onWeekOffsetChange?: (offset: number) => void;

  /** Contenido a mostrar cuando un día no tiene ítems. Por defecto "–". */
  emptyPlaceholder?: React.ReactNode;

  /** Clase CSS adicional para el contenedor raíz. */
  className?: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function AgendaSemanal<T>({
  items,
  getDateKey,
  renderItem,
  weekOffset: weekOffsetProp,
  onWeekOffsetChange,
  emptyPlaceholder = "–",
  className = "",
}: AgendaSemanalProps<T>) {
  // Estado interno (modo no controlado)
  const [internalOffset, setInternalOffset] = useState(0);

  const isControlled = weekOffsetProp !== undefined;
  const weekOffset = isControlled ? weekOffsetProp! : internalOffset;

  const handlePrev = () => {
    if (isControlled) {
      onWeekOffsetChange?.(weekOffset - 1);
    } else {
      setInternalOffset((o) => o - 1);
    }
  };
  const handleNext = () => {
    if (isControlled) {
      onWeekOffsetChange?.(weekOffset + 1);
    } else {
      setInternalOffset((o) => o + 1);
    }
  };

  const { lunes, viernes } = useMemo(
    () => getWeekRangeForOffset(weekOffset),
    [weekOffset]
  );
  const dias = useMemo(() => getWeekDays(lunes), [lunes]);
  const todayStr = useMemo(() => toISODateStr(new Date()), []);

  // Distribuir ítems en su día correspondiente
  const porDia = useMemo<T[][]>(() => {
    return dias.map((dia) => {
      const diaStr = toISODateStr(dia);
      return items.filter((item) => {
        const key = getDateKey(item);
        if (!key) return false;
        return key.substring(0, 10) === diaStr;
      });
    });
  }, [items, dias, getDateKey]);

  return (
    <div className={`agenda-semanal ${className}`.trim()}>
      {/* ── Cabecera: título + navegación de semana ── */}
      <div className="agenda-semanal__header">
        <span className="agenda-semanal__titulo">Agenda</span>
        <div className="agenda-semanal__nav">
          <button
            className="agenda-semanal__nav-btn"
            onClick={handlePrev}
            title="Semana anterior"
          >
            ‹
          </button>
          <span className="agenda-semanal__rango">
            {formatVisual(lunes)} – {formatVisual(viernes)}
          </span>
          <button
            className="agenda-semanal__nav-btn"
            onClick={handleNext}
            title="Semana siguiente"
          >
            ›
          </button>
        </div>
      </div>

      {/* ── Grid Mon–Vie ── */}
      <div className="agenda-semanal__grid">
        {dias.map((dia, i) => {
          const diaStr = toISODateStr(dia);
          const esHoy = diaStr === todayStr;
          return (
            <div
              key={diaStr}
              className={`agenda-semanal__col${esHoy ? " agenda-semanal__col--hoy" : ""}`}
            >
              <div className="agenda-semanal__col-header">
                <span className="agenda-semanal__dia-nombre">{DIAS_NOMBRE[i]}</span>
                <span className="agenda-semanal__dia-fecha">
                  {String(dia.getDate()).padStart(2, "0")}
                </span>
              </div>
              <div className="agenda-semanal__col-body">
                {porDia[i].length === 0 ? (
                  <div className="agenda-semanal__vacio">{emptyPlaceholder}</div>
                ) : (
                  porDia[i].map((item, j) => renderItem(item, j))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
  