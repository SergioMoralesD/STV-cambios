
// ============================================================================
// =======  LOGICA COMUN PARA TODAS LAS PAGINAS  =============================
// ============================================================================
import { getClaseFamilia as getClaseFamiliaBase } from "../config/regionConfig";
import * as TimeUtils from "../utils/timeUtils";
import * as UIUtils from "../utils/uiUtils";

/**
 * Formato de duración: "HHh MM'"
 */
export const formatDuration = (minutes: number | null | undefined): string => TimeUtils.formatDuration(minutes);

/**
 * Formato de duración extendido: "Xd Yh"
 */
export const formatDaysHours = (inputSeconds: number | null | undefined): string => TimeUtils.formatDaysHours(inputSeconds);

/**
 * Lógica de colores para filas basada en SLA
 */
export const getSLAColor = (slaValue: number | string | null | undefined, userStatus?: string, codeActivity?: string): string => 
  UIUtils.getSLAColor(slaValue, userStatus, codeActivity);

/**
 * Lógica extendida para identificar familias de máquinas
 */
export function getEnhancedFamily(family: string, noticeType: string, material?: string): [string, string] {
  // 1. Intentar con la lógica base de regionConfig
  const [sigla, clase] = getClaseFamiliaBase(family, noticeType);
  if (sigla !== "?") return [sigla, clase];

  // 2. Fallback con reglas por material (específico de Logistics)
  const m = (material || "").toUpperCase();
  if (m.includes("POST MIX") || m.includes("PRE MIX") || m.includes("TRADICIONAL") || m.includes("CABEZAL")) return ["DI", "colorDispensing"];
  if (m.includes("VITRINA") || m.includes("CHAPA") || m.includes("COOLER")) return ["VI", "colorVitrina"];
  if (m.includes("BOTELLERO")) return ["BO", "colorBotellero"];
  if (m.includes("VENDING")) return ["VE", "colorVending"];

  // 3. Fallback por tipo de aviso
  const t = (noticeType || "").substring(0, 2).toUpperCase();
  if (["HA", "HI", "HC", "HR", "HT"].includes(t)) return ["DI", "colorDispensing"];
  if (t === "FC" || t === "FI") return ["VI", "colorVitrina"];
  if (t === "FR") return ["BO", "colorBotellero"];

  return ["VI", "colorVitrina"]; // Fallback final
}

/**
 * Colores de diferencia (Reglas: 1-4 rojo, 5-7 amarillo, 8+ verde)
 */
export const getDiffColor = (diff: number | string | null | undefined): string => UIUtils.getDiffColor(diff);

/**
 * Estilos para fechas pasadas
 */
export const getFechaClass = (fecha: string | null | undefined): string => UIUtils.getFechaClass(fecha);

/**
 * Lógica de colores para Logistics basado en Diferencia2
 */
export const getFechaLogisticsClass = (fecha: string | null | undefined, diff2: number | string | null | undefined): string => 
  UIUtils.getFechaLogisticsClass(fecha, diff2);


/**
 * Lógica de colores para SLA en días (Almacén / ST02)
 */
export const getSlaWarehouseClass = (days: number | null | undefined): string => UIUtils.getSlaWarehouseClass(days);

/**
 * Mensaje informativo para SLA en días
 */
export function getSlaWarehouseMessage(days: number | null | undefined): string {
  if (days == null) return "No se ha podido calcular el SLA";
  const diff = 150 - days;
  if (diff >= 0) return `Días para que se cumpla el SLA: ${diff} días`;
  return `Días desde que se ha cumplido el SLA: ${Math.abs(diff)} días`;
}

/**
 * Identifica si un equipo es Cabezal (CA / Cornelius)
 */
export function esCabezal(tipoFamilia: string | null | undefined): boolean {
  return (tipoFamilia || "").toUpperCase() === "CA";
}

/**
 * Crea un mapa de cuenta por cliente en un conjunto de datos
 */
export function getClientCounts(data: Record<string, unknown>[], clientKey: string = 'clienteLabel'): Record<string, number> {
  const counts: Record<string, number> = {};
  data.forEach(item => {
    const client = (item[clientKey] as string) || "—";
    counts[client] = (counts[client] || 0) + 1;
  });
  return counts;
}

  