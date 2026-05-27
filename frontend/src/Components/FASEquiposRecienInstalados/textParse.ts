// src/webs/FAEquiposInstalados/textParse.ts
import { formatearFechaVisual } from "../../config/regionConfig";
import type { FAEquipo } from "../../services/Types";

// ─── TIPOS ────────────────────────────────────────────────────────────────

export interface Actividad {
  COD?: string;
  DESC?: string;
  NOTA?: string;
  [key: string]: string | undefined;
}

export interface Intervencion {
  COD_INTERV?: string;
  COD_LLAMADA?: string;
  FECHA?: string;
  TECNICO?: string;
  AVERIA_SENALADA?: string;
  DESC?: string;
  NOTAS?: string;
  NIVEL?: string;
  COD_REDISP?: string;
  SUBFAMILIA?: string;
  ACTIVIDADES?: Actividad[];
  [key: string]: string | Actividad[] | undefined;
}

// ─── PARSEO ───────────────────────────────────────────────────────────────

export function buildActividadesArray(texto: string): Actividad[] {
  if (!texto) return [];
  if (/sin actividades/i.test(texto)) return [];

  const matches = [...texto.matchAll(/\[([^\]]*?)\]/g)];
  let bloques: string[] = matches.length ? matches.map((m) => m[1]) : [];

  if (bloques.length === 0) {
    bloques = texto
      .split(";")
      .map((b) => b.trim())
      .filter(Boolean);
  }

  return bloques.map((bloque) => {
    bloque = bloque.replace(/^[\(\[]+|[\)\];]+$/g, "").trim();
    const partes = bloque.split(/\s*\|\s*/).filter(Boolean);
    const actividad: Actividad = {};
    partes.forEach((p) => {
      const [clave, ...valorParts] = p.split(":");
      if (!clave) return;
      actividad[clave.trim()] = valorParts
        .join(":")
        .replace(/[\)\];]+$/g, "")
        .trim();
    });
    return actividad;
  });
}

export function buildIntervencionesArray(texto: string): Intervencion {
  if (!texto || texto.trim().toLowerCase().startsWith("sin")) return {};

  const partes = texto.split(" | ");
  const datos: Intervencion = {};

  const actividadesParteIndex = partes.findIndex((p) =>
    p.startsWith("ACTIVIDADES:"),
  );
  let actividadesRaw: string | null = null;

  if (actividadesParteIndex !== -1) {
    actividadesRaw = partes.slice(actividadesParteIndex).join(" | ");
    partes.splice(actividadesParteIndex);
  }

  partes.forEach((parte) => {
    const [clave, ...valorParts] = parte.split(":");
    if (!clave) return;
    datos[clave.trim()] = valorParts.join(":").trim();
  });

  if (actividadesRaw) {
    let contenido = actividadesRaw.replace(/^ACTIVIDADES:/i, "").trim();
    contenido = contenido.replace(/^\(/, "").replace(/\)$/, "").trim();
    datos.ACTIVIDADES = buildActividadesArray(contenido);
  }

  return datos;
}

export function buildIntervencionObject(texto: string): Intervencion[] {
  if (!texto || texto.trim().toLowerCase().startsWith("sin")) return [];

  return texto
    .split(/\n+/)
    .filter((l) => l.trim() !== "")
    .map((linea) => buildIntervencionesArray(linea.trim()))
    .filter((i) => Object.keys(i).length > 0);
}

// ─── BUILDER HOVER ────────────────────────────────────────────────────────

export function construirHover(row: FAEquipo): string {
  const averias = buildIntervencionesArray(row.averias_text);
  const intervenciones = buildIntervencionObject(row.intervenciones_text);
  const redisposiciones = buildIntervencionesArray(row.redisposiciones_text);

  let intervencionesText = "";
  if (intervenciones.length > 0) {
    intervenciones.forEach((intervencion) => {
      intervencionesText += `   · ${formatearFechaVisual(intervencion.FECHA || "")}: ${intervencion.TECNICO || ""} \n`;
      const acts = intervencion.ACTIVIDADES || [];
      if (acts.length > 0) {
        acts.forEach((actividad) => {
          intervencionesText += `      * ${actividad.DESC || "No hay actividad"} (${actividad.NOTA || "No hay notas"}) \n`;
        });
      } else {
        intervencionesText += `       * No hubo actividades en la intervención\n`;
      }
    });
  } else {
    intervencionesText = `   · No hubo intervenciones \n`;
  }

  let actividadesFDText = "";
  if (redisposiciones && Object.keys(redisposiciones).length > 0) {
    const acts = redisposiciones.ACTIVIDADES || [];
    if (acts.length > 0) {
      acts.forEach((actividad) => {
        actividadesFDText += `      * ${actividad.DESC || "No hay descripción de la actividad"} \n`;
      });
    } else {
      actividadesFDText = `       * No hubo actividades en la FD \n`;
    }
  } else {
    actividadesFDText = "No hay ninguna redisposición";
  }

  return `MODELO: ${row.cod_modelo} - ${row.modelo}
RETIRADO DE: ${row.cliente_cod} - ${row.cliente_nombre}

AVERÍA (${formatearFechaVisual(averias.FECHA || "")}): ${averias.DESC || ""}
${intervencionesText}
FD ANTERIOR REALIZADA (${formatearFechaVisual(redisposiciones.FECHA || "")}):
    · NIVEL: ${redisposiciones.NIVEL || ""}
${actividadesFDText}`;
}
  