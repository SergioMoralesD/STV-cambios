import type { SlaSt02Row } from "../../services/Types";
import type { ColorCount } from "./types";
import { buildContadores } from "./helpers";
import { DELEG_ABREV, FAMILIA_ROWS } from "./constants";

// ─── COLOR BADGE ──────────────────────────────────────────────────────────

function ColorBadge({ count }: { count: ColorCount }) {
  const c = count || { total: 0, verde: 0, amarillo: 0, rojo: 0 };
  return (
    <span className="sla-badge-wrapper">
      <span className="sla-badge-total">{c.total}</span>
      <span className="sla-badge-colors">
        <span className="sla-badge sla-badge-verde">{c.verde}</span>
        <span className="sla-badge sla-badge-amarillo">{c.amarillo}</span>
        <span className="sla-badge sla-badge-rojo">{c.rojo}</span>
      </span>
    </span>
  );
}

// ─── SUMMARY TABLE ────────────────────────────────────────────────────────

interface SummaryTableProps {
  delegaciones: string[];
  allRows: SlaSt02Row[];
  getFamilyColorClass?: (familyCode: string) => string; // kept for API compatibility
}

export function SummaryTable({ delegaciones, allRows }: SummaryTableProps) {
  const summaries = delegaciones.map((deleg) => {
    const delegRows = allRows.filter((r) => r.DELEGACION === deleg);
    const contadores = buildContadores(delegRows);

    const total: ColorCount = {
      total:
        contadores.DI.total +
        contadores.VI.total +
        contadores.VE.total +
        contadores.BO.total +
        contadores.CA.total,
      verde:
        contadores.DI.verde +
        contadores.VI.verde +
        contadores.VE.verde +
        contadores.BO.verde +
        contadores.CA.verde,
      amarillo:
        contadores.DI.amarillo +
        contadores.VI.amarillo +
        contadores.VE.amarillo +
        contadores.BO.amarillo +
        contadores.CA.amarillo,
      rojo:
        contadores.DI.rojo +
        contadores.VI.rojo +
        contadores.VE.rojo +
        contadores.BO.rojo +
        contadores.CA.rojo,
    };

    return { deleg, contadores, total };
  });

  return (
    <div className="sla-summary-wrapper">
      <table className="sla-summary-table">
        <thead>
          <tr>
            <th className="sla-summary-label-th thSlaSt02Dashboard" />
            {summaries.map(({ deleg }) => (
              <th
                key={deleg}
                className="sla-summary-deleg-th thSlaSt02Dashboard"
              >
                {(DELEG_ABREV[deleg] ?? deleg).toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FAMILIA_ROWS.map(({ key, label, cls }) => (
            <tr key={key}>
              <td className={`sla-summary-label ${cls}`}>{label}</td>
              {summaries.map(({ deleg, contadores }) => (
                <td key={deleg} className="sla-summary-val">
                  <ColorBadge count={contadores[key]} />
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <td className="sla-summary-label sla-summary-total">TOTAL</td>
            {summaries.map(({ deleg, total }) => (
              <td key={deleg} className="sla-summary-val sla-summary-total-val">
                <ColorBadge count={total} />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

  