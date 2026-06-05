import {
  formatearFechaParaAPI as formatearFechaParaApiGlobal,
  formatearFechaVisual,
  getFechaHaceUnMesISO,
  getFechaHoyISO,
  parseMpsConImagenes,
} from "../../config/regionConfig";
import { type MaquinaRetirada } from "../../services/Types";
import { type Actividad, type Intervencion } from "./types";

// ─── PARSEO ────────────────────────────────────────────────────────────────

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

// ─── FECHAS ────────────────────────────────────────────────────────────────

export function getFechaHoy(): string {
  return getFechaHoyISO();
}

export function getFechaMes(): string {
  return getFechaHaceUnMesISO();
}

export function formatearFechaParaAPI(fechaStr: string): string {
  return formatearFechaParaApiGlobal(fechaStr);
}

// ─── HOVER ─────────────────────────────────────────────────────────────────

export function construirHover(
  row: MaquinaRetirada,
  redisposicion: Intervencion,
): string {
  const solicitudCambio =
    buildIntervencionesArray(row.solicitud_cambio_text) || {};
  const actSolicitudCambio = solicitudCambio.ACTIVIDADES || [];

  let actSolicitudCambioText = "";
  if (actSolicitudCambio.length > 0) {
    actSolicitudCambio.forEach((actividad) => {
      actSolicitudCambioText += `     * ${actividad.MOTIVO || "No hay descripción"} (${actividad.NOTAS || ""})\n`;
    });
  } else {
    actSolicitudCambioText = `      * No hubo actividades \n`;
  }

  let redisposicionesActText = "";
  if (redisposicion && Object.keys(redisposicion).length > 0) {
    redisposicionesActText += `\nFD REALIZADA (${formatearFechaVisual(redisposicion.FECHA || "")}): \n`;
    const acts = redisposicion.ACTIVIDADES || [];
    if (acts.length > 0) {
      redisposicionesActText += `      * ${redisposicion.DESC || "No hay descripción"} \n`;
    } else {
      redisposicionesActText += "    · No hay actividades \n";
    }
  }

  return `MODELO: ${row.cod_modelo} - ${row.modelo}
RETIRADO DE: ${row.cliente_cod} - ${row.cliente_nombre}

CAMBIO SOLICITADO (${formatearFechaVisual((solicitudCambio.FECHA as string) || "")})
    · ${solicitudCambio.TECNICO || ""} - ${solicitudCambio.NOMBRE || ""}
${actSolicitudCambioText}${redisposicionesActText}`;
}

// ─── MAINPLANTS ────────────────────────────────────────────────────────────

export function parseMps(mps: string, islaImg: Record<string, string>) {
  return parseMpsConImagenes(mps, islaImg);
}
  