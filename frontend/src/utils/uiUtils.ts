/**
 * Lógica de colores para filas basada en SLA
 */
export function getSLAColor(slaValue: number | string | null | undefined, userStatus?: string, codeActivity?: string): string {
  const sla = Number(slaValue) || 0;
  const isPause = userStatus === "E0011";

  if (isPause) {
    if (["002", "003", "004", "009"].includes(codeActivity ?? "")) return "morado";
    if (sla > 8) return "moradoverde";
    if (sla >= 2) return "moradoamarillo";
    if (sla >= 0.5) return "moradorojo";
    if (sla > 0) return "moradorojo parpadea";
    return "moradonegro";
  }

  if (sla > 8) return "verde";
  if (sla >= 2) return "amarillo";
  if (sla >= 0.5) return "rojo";
  if (sla > 0) return "rojo parpadea";
  return "negro";
}

/**
 * Colores de diferencia (Reglas: 1-4 rojo, 5-7 amarillo, 8+ verde)
 */
export function getDiffColor(diff: number | string | null | undefined): string {
  const d = Number(diff) || 0;
  if (d >= 1 && d <= 4) return "rojo";
  if (d >= 5 && d <= 7) return "amarillo";
  if (d >= 8) return "verde";
  return "negro";
}

/**
 * Estilos para fechas pasadas
 */
export function getFechaClass(fecha: string | null | undefined): string {
  if (!fecha) return "fecha-cell";
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaDate = new Date(fecha.substring(0, 10));
  return fechaDate < hoy ? "fecha-cell fecha-pasada" : "fecha-cell";
}

/**
 * Lógica de colores para Logistics basado en Diferencia2
 */
export function getFechaLogisticsClass(fecha: string | null | undefined, diff2: number | string | null | undefined): string {
  const d = Number(diff2) || 0;
  let bgClass = "rojo";
  if (d > 7) bgClass = "verde";
  else if (d >= 4) bgClass = "amarillo";

  let baseClass = `fecha-cell ${bgClass}`;
  if (!fecha) return baseClass;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaDate = new Date(fecha.substring(0, 10));
  if (fechaDate < hoy) {
    baseClass += " fecha-pasada";
  }
  return baseClass;
}

/**
 * Lógica de colores para SLA en días (Almacén / ST02)
 */
export function getSlaWarehouseClass(days: number | null | undefined): string {
  if (days === null || days === undefined) return "rojo parpadea";
  if (days >= 150) return "negro";
  if (days >= 140) return "rojo";
  if (days >= 120) return "amarillo";
  return "verde";
}

export type IconType = "red" | "green" | "black" | "redVEL" | "greenVEL" | "blackVEL";

export function getIconUrl(iconType: IconType): string {
  const map: Record<IconType, string> = {
    red: "./src/img/carMarkerRED.png",
    green: "./src/img/carMarkerGREEN.png",
    black: "./src/img/carMarker.png",
    redVEL: "./src/img/carMarkerREDVEL.png",
    greenVEL: "./src/img/carMarkerGREENVEL.png",
    blackVEL: "./src/img/carMarkerVEL.png",
  };
  return map[iconType];
}

export function getFontColorClass(iconType: IconType): string {
  if (iconType.includes("red")) return "red";
  if (iconType.includes("green")) return "green";
  return "black";
}

export const TECHNICIAN_COLORS: string[] = [
  "#63b598", "#ce7d78", "#ea9e70", "#a48a9e", "#648177", "#0d5ac1",
  "#f205e6", "#1c0365", "#14a9ad", "#4ca2f9", "#a4e43f", "#d298e2",
  "#6119d0", "#d2737d", "#c0a43c", "#f2510e", "#651be6", "#79806e",
  "#61da5e", "#cd2f00", "#9348af", "#01ac53", "#c5a4fb", "#996635",
  "#b11573", "#4bb473", "#75d89e", "#2f3f94", "#2f7b99", "#da967d",
  "#34891f", "#b0d87b", "#ca4751", "#7e50a8", "#c4d647", "#e0eeb8",
  "#11dec1", "#289812", "#566ca0", "#ffdbe1", "#2f1179", "#935b6d",
  "#916988", "#513d98", "#aead3a", "#9e6d71", "#4b5bdc", "#b2be57",
  "#fa06ec", "#1bb699", "#6b2e5f", "#64820f"
];

/**
 * Lógica de colores de fondo basada en un valor numérico
 */
export function getBGColor(number: number): string {
  if (number === 0) return "#63bc7b";
  if (number < 3) return "#d3df82";
  if (number < 7) return "#fed880";
  if (number < 12) return "#fa8a72";
  return "#fd2e32";
}
  