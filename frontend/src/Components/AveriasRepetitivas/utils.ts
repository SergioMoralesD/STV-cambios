import React from "react";
import type {
  AveriaCompleta,
  AveriaIntervencion,
  AveriaActividad,
} from "../../services/averiaService";
import {
  extraerDelegacionesDesdeMainplant,
  formatearFechaVisual,
  getClaseFamilia,
  obtenerImagenIsla,
  obtenerNombreIsla,
} from "../../config/regionConfig";

// ─── Delegaciones: imagen y nombre ──────────────────────────────────────────

interface DelegInfo {
  img: string;
  name: string;
}

export function getDelegInfo(deleg: string): DelegInfo {
  return {
    img: obtenerImagenIsla(deleg),
    name: obtenerNombreIsla(deleg),
  };
}

// ─── Delegaciones por región ────────────────────────────────────────────────

export function getFilis(mainplant: string): string[] {
  return extraerDelegacionesDesdeMainplant(mainplant);
}

// ─── Colores de fila según cuenta30 ─────────────────────────────────────────

export function getRowColor(cuenta30: number): {
  colorClass: string;
  textColor: string;
} {
  if (cuenta30 > 15) return { colorClass: "negro", textColor: "white" };
  if (cuenta30 > 10) return { colorClass: "rojo", textColor: "white" };
  if (cuenta30 > 5) return { colorClass: "amarillo", textColor: "black" };
  return { colorClass: "verde", textColor: "white" };
}

export { getClaseFamilia };

// ─── Parser de actividades ───────────────────────────────────────────────────

function parseActividades(actText: string): AveriaActividad[] {
  const actividades: AveriaActividad[] = [];
  const matches = actText.matchAll(/\[([^\]]+)\]/g);
  for (const match of matches) {
    const bloque = match[1];
    const get = (key: string) =>
      bloque.match(new RegExp(`${key}:([^|\\]]+)`))?.[1]?.trim() || "";
    actividades.push({
      ACTIVIDAD: get("ACTIVIDAD"),
      DESC: get("DESC"),
      NOTA: get("NOTA") || null,
    });
  }
  return actividades;
}

// ─── Parser de intervenciones ────────────────────────────────────────────────

function parseIntervenciones(intervText: string): AveriaIntervencion[] {
  const bloques = intervText.split(/(?=COD_INTERV:)/).filter(Boolean);

  return bloques.map((bloque) => {
    const get = (key: string) =>
      bloque.match(new RegExp(`${key}:([^|)]+)`))?.[1]?.trim() || "";

    const actMatch = bloque.match(
      /ACTIVIDADES:\((\[[\s\S]*?\](?:;\s*\[[\s\S]*?\])*)\)/,
    );
    const actividades = actMatch ? parseActividades(actMatch[1]) : [];

    return {
      FECHA_INTERV: get("FECHA_INTERV"),
      AVERIA_ENCONTRADA: get("AVERIA_ENCONTRADA"),
      AVERIA_ENCONTRADA_DESC: get("AVERIA_ENCONTRADA_DESC"),
      TECNICO_COD: get("TECNICO_COD"),
      TECNICO_NOM:
        bloque.match(/TECNICO_NOM:([^|]+?)(?:\s*\|)/)?.[1]?.trim() || "",
      NOTAS: bloque.match(/NOTAS:([^|A]+?)(?:\s*\|)/)?.[1]?.trim() || null,
      ACTIVIDADES: actividades,
    };
  });
}

// ─── Parser principal de averías ─────────────────────────────────────────────

export function parseAveriasCompletas(rawText: string): AveriaCompleta[] {
  if (!rawText) return [];

  const bloques = rawText.split(/(?=AVERIA:)/).filter(Boolean);

  return bloques.map((bloque) => {
    const get = (key: string) =>
      bloque.match(new RegExp(`${key}:([^|]+)`))?.[1]?.trim() || "";

    let intervenciones: AveriaIntervencion[] = [];
    const intervStart = bloque.indexOf("INTERVENCIONES:(");
    if (intervStart !== -1) {
      const start = intervStart + "INTERVENCIONES:(".length;
      let depth = 1;
      let i = start;
      while (i < bloque.length && depth > 0) {
        if (bloque[i] === "(") depth++;
        else if (bloque[i] === ")") depth--;
        i++;
      }
      const intervText = bloque.substring(start, i - 1);
      intervenciones = parseIntervenciones(intervText);
    }

    return {
      FECHA_AVISO: get("FECHA_AVISO"),
      AVERIA_DECLARADA_DESC: get("AVERIA_DECLARADA_DESC"),
      INTERVENCIONES: intervenciones,
    };
  });
}

// ─── Formateo del tooltip sin JSX (usando React.createElement) ────────────────

export function construirHover(data: {
  matricula_original: string;
  averias_text: string;
}): React.ReactNode {
  const listaAverias = parseAveriasCompletas(data.averias_text);

  if (!listaAverias || listaAverias.length === 0) {
    return React.createElement("div", { className: "tooltip-inner", style: { padding: '10px' } },
      React.createElement("div", { className: "tooltip-title" }, data.matricula_original),
      React.createElement("hr", { className: "tooltip-divider" }),
      React.createElement("div", { style: { fontStyle: 'italic', opacity: 0.7 } }, "Sin historial de averías registrado")
    );
  }

  return React.createElement("div", { className: "tooltip-inner" },
    React.createElement("div", { className: "tooltip-title" }, data.matricula_original),
    React.createElement("hr", { className: "tooltip-divider" }),
    React.createElement("div", { className: "tooltip-body" },
      listaAverias.map((averia, avIdx) => {
        const fechaAviso = formatearFechaVisual(averia.FECHA_AVISO);
        return React.createElement("div", { key: avIdx, className: "tooltip-record" },
          React.createElement("div", { className: "tooltip-date" }, `· ${fechaAviso}`),
          React.createElement("div", { className: "tooltip-desc" }, averia.AVERIA_DECLARADA_DESC),
          averia.INTERVENCIONES.map((inter, intIdx) =>
            React.createElement("div", { key: intIdx, className: "tooltip-intervention" },
              React.createElement("div", { className: "tooltip-tech" },
                `(${formatearFechaVisual(inter.FECHA_INTERV)}) ${inter.TECNICO_COD} — ${inter.TECNICO_NOM}`
              ),
              inter.ACTIVIDADES.map((act, actIdx) =>
                React.createElement("div", { key: actIdx, className: "tooltip-activity" },
                  `* ${act.ACTIVIDAD ? `${act.ACTIVIDAD} — ` : ""}${act.DESC}${act.NOTA ? ` (${act.NOTA})` : ""}`
                )
              )
            )
          ),
          avIdx < listaAverias.length - 1 ? React.createElement("div", { className: "tooltip-spacer" }) : null
        );
      })
    )
  );
}
  