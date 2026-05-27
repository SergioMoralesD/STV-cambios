// src/Components/STVLogistics/TablaResumenLogistica.tsx
import React from "react";
import type { RecuentoEstado, IslaData } from "../../services/Types";
import { obtenerNombreIsla } from "../../config/regionConfig";
import "./TablaResumenLogistica.css";

function getBGColor(number: number): string {
  if (number === 0) return "#63bc7b";
  if (number < 3) return "#9cdf82";
  if (number < 7) return "#fed880";
  if (number < 12) return "#fa8a72";
  return "#fd2e32";
}

function getAbsoluteColorClass(timeStr: string, isAnio: boolean): string {
  const seconds = timeToSeconds(timeStr);
  const days = seconds / 86400;

  if (isAnio) {
    if (days >= 4) return "Color14"; // Rojo
    if (days >= 3) return "Color10"; // Naranja
    if (days >= 2) return "Color7";  // Amarillo
    return "Color0"; // Verde
  } else {
    // Mes es TODO VERDE (según captura objetivo)
    return "Color0";
  }
}

function timeToSeconds(t: string | number): number {
  const str = String(t ?? "");
  const match = str.match(/(\d+)d\s*(\d+)h/);
  if (!match) return 0;
  return parseInt(match[1], 10) * 86400 + parseInt(match[2], 10) * 3600;
}

/**
 * Lógica de colores relativa de STV Logistics (Legacy)
 * Ordena valores únicos y asigna ColorX según el rango.
 */
function getColorNumber(index: number) {
  if (index >= 20) return "15";
  if (index >= 18) return "14";
  if (index >= 16) return "13";
  if (index >= 14) return "13";
  if (index >= 12) return "12";
  if (index >= 11) return "11";
  if (index >= 10) return "10";
  if (index >= 9) return "8";
  if (index >= 8) return "7";
  if (index >= 7) return "6";
  if (index >= 6) return "5";
  if (index >= 5) return "5";
  if (index >= 3) return "3";
  if (index >= 0) return "0";
  return "0";
}

function normalizeToken(value: unknown): string {
  return String(value ?? "").trim().toUpperCase();
}

function parseCount(value: unknown): number {
  const raw = String(value ?? "").trim();
  if (!raw) return 0;

  const normalized =
    raw.includes(",") && !raw.includes(".")
      ? raw.replace(",", ".")
      : raw.replace(/,/g, "");

  const num = Number(normalized);
  return Number.isFinite(num) ? num : 0;
}

interface Props {
  mainplants: string[];
  tiemposAnio: Record<string, IslaData>;
  tiemposMes: Record<string, IslaData>;
  recuentos: RecuentoEstado[];
  marginTop?: number;
}

interface TipoGrupo {
  label: string;
  aggregateCode: string;
  detailCodes: string[];
}

const FILAS: { key: keyof IslaData; label: string }[] = [
  { key: "DI", label: "Dispen" },
  { key: "VI", label: "Vitr" },
  { key: "VE", label: "Vend" },
  { key: "BO", label: "Bote" },
];

const TIPOS: TipoGrupo[] = [
  { label: "FI / HI", aggregateCode: "I", detailCodes: ["FI", "HI"] },
  { label: "FC / HC", aggregateCode: "S", detailCodes: ["FC", "HC"] },
  { label: "FR / HR", aggregateCode: "R", detailCodes: ["FR", "HR", "F R"] },
];

export default function TablaResumenLogistica({
  mainplants,
  tiemposAnio,
  tiemposMes,
  recuentos,
  marginTop = 10
}: Props) {
  const islas = (mainplants || []).filter((mp) => mp !== "6S21_MENORES");

  // ── Pre-cálculo de colores relativos (Legacy) ──────────────────────────
  const getUniqueSeconds = (data: Record<string, IslaData>) => {
    if (!data || !islas.length) return [];
    const vals = new Set<number>();
    islas.forEach((mp) => {
      FILAS.forEach((f) => {
        const t = data[mp]?.[f.key];
        if (t) vals.add(timeToSeconds(t));
      });
    });
    return Array.from(vals).sort((a, b) => a - b);
  };

  const uniqueSecondsAnio = getUniqueSeconds(tiemposAnio);
  const uniqueSecondsMes = getUniqueSeconds(tiemposMes);

  function getRecuento(mp: string, tipo: TipoGrupo) {
    const delegaciones = mp === "6S21" ? ["6S21", "6S21_MENORES"] : [mp];
    const delegSet = new Set(delegaciones.map(normalizeToken));
    const detailCodeSet = new Set(tipo.detailCodes.map(normalizeToken));
    const aggregateCode = normalizeToken(tipo.aggregateCode);

    const countsByTipo = new Map<string, { activo: number; pausa: number }>();

    for (const r of recuentos) {
      const deleg = normalizeToken(r.DELEGACION);
      if (!delegSet.has(deleg)) continue;

      const tipoCode = normalizeToken(r.TIPO);
      if (tipoCode !== aggregateCode && !detailCodeSet.has(tipoCode)) continue;

      const current = countsByTipo.get(tipoCode) ?? { activo: 0, pausa: 0 };
      current.activo += parseCount(r.ACTIVAS);
      current.pausa += parseCount(r.PAUSA);
      countsByTipo.set(tipoCode, current);
    }

    let activo = 0;
    let pausa = 0;

    const agg = countsByTipo.get(aggregateCode);
    if (agg) {
      activo = agg.activo;
      pausa = agg.pausa;
    } else {
      for (const code of tipo.detailCodes) {
        const det = countsByTipo.get(normalizeToken(code));
        if (det) {
          activo += det.activo;
          pausa += det.pausa;
        }
      }
    }

    const total = activo + pausa;
    return { total, activo, pausa };
  }

  const getDisplayLabel = (code: string) => {
    if (code === "6S21" || code.includes("6S21")) return "TF / IM";
    if (code === "6S23") return "GC";
    if (code === "6S24") return "LZ";
    if (code === "6S25") return "FV";
    return obtenerNombreIsla(code, true);
  };

  return (
    <div className="tabla-resumen-wrapper" style={{ marginTop: `${marginTop}px` }}>

      <table className="tabla-resumen-logistica">
        <thead>
        <tr>
          <th colSpan={2} className="corner-cell"></th>
          {islas.map((mp) => (
            <th key={mp} colSpan={3}>
              {getDisplayLabel(mp)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {FILAS.map((f, i) => (
          <tr key={"anio-" + String(f.key)}>
            {i === 0 && (
              <td rowSpan={4} className="periodo-cell azul">
                Año
              </td>
            )}
            <td className="label-cell blanco">{f.label}</td>
            {islas.map((mp) => {
              const val = tiemposAnio[mp]?.[f.key] ?? "-";
              const cls = val !== "-" ? getAbsoluteColorClass(val, true) : "";

              return (
                <td key={mp} colSpan={3} className={`valor-cell ${cls}`}>
                  {val}
                </td>
              );
            })}
          </tr>
        ))}

        {FILAS.map((f, i) => (
          <tr key={"mes-" + String(f.key)}>
            {i === 0 && (
              <td rowSpan={4} className="periodo-cell blanco">
                Mes
              </td>
            )}
            <td className="label-cell azul">{f.label === "Vitr" ? "Vitri" : f.label}</td>
            {islas.map((mp) => {
              const val = tiemposMes[mp]?.[f.key] ?? "-";
              const cls = val !== "-" ? getAbsoluteColorClass(val, false) : "";

              return (
                <td key={mp} colSpan={3} className={`valor-cell ${cls}`}>
                  {val}
                </td>
              );
            })}
          </tr>
        ))}

        <tr>
          <td colSpan={2} className="tipos-header">
            Tipos
          </td>
          {islas.map((mp) => (
            <React.Fragment key={mp}>
              <td className="tipos-subheader">Total</td>
              <td className="tipos-subheader">Activas</td>
              <td className="tipos-subheader">Pausa</td>
            </React.Fragment>
          ))}
        </tr>

        {TIPOS.map((tipo) => (
          <tr key={tipo.label}>
            <td colSpan={2} className="tipo-label">
              {tipo.label}
            </td>
            {islas.map((mp) => {
              const { total, activo, pausa } = getRecuento(mp, tipo);
              return (
                <React.Fragment key={mp}>
                  <td className="count-cell" style={{ backgroundColor: getBGColor(total) }}>
                    {total}
                  </td>
                  <td className="count-cell" style={{ backgroundColor: getBGColor(activo) }}>
                    {activo}
                  </td>
                  <td className="count-cell" style={{ backgroundColor: getBGColor(pausa) }}>
                    {pausa}
                  </td>
                </React.Fragment>
              );
            })}
          </tr>
        ))}
      </tbody>
      </table>
    </div>
  );
}
  