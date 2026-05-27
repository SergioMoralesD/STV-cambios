import type { ColumnaIsla } from "./Types";
import {
  obtenerColumnasIsla,
  obtenerColumnasIslaObjetos,
  obtenerImagenIsla,
  obtenerMetaIslas,
  obtenerNombreIsla,
} from "../config/regionConfig";
import * as TimeUtils from "../utils/timeUtils";
import * as UIUtils from "../utils/uiUtils";
import * as GeoUtils from "../utils/geoUtils";
import * as CookieUtils from "../utils/cookieUtils";

// ─── MAPEOS DE ISLAS ─────────────────────────────────────────────────────────
const META_ISLAS = obtenerMetaIslas();
const ISLAS_KEYS = Object.keys(META_ISLAS);

export const ISLA_IMG: Record<string, string> = Object.fromEntries(
  ISLAS_KEYS.map((code) => [code, obtenerImagenIsla(code)]),
) as Record<string, string>;

export const ISLA_NOMBRE: Record<string, string> = Object.fromEntries(
  ISLAS_KEYS.map((code) => [code, obtenerNombreIsla(code)]),
) as Record<string, string>;

export function getColumnas(mainplant: string): string[] {
  return obtenerColumnasIsla(mainplant);
}

export function getColumnasObjetos(mainplant: string, userRole?: string): ColumnaIsla[] {
  return obtenerColumnasIslaObjetos(mainplant, userRole) as ColumnaIsla[];
}

// ─── LÓGICA DE NEGOCIO (COLORES E IMÁGENES) ───────────────────────────────────
export const getImg = (fili: string): string => obtenerImagenIsla(fili);

export const getBGColor = (number: number): string => UIUtils.getBGColor(number);

export const getColorDif = (diferencia: number): string => UIUtils.getDiffColor(diferencia);

export const secondsToTime = (inputSeconds: number): string => TimeUtils.formatDaysHours(inputSeconds);

// ─── MAPA: FORMATEO DE FECHAS ─────────────────────────────────────────────────

export const formatDate = (d: Date): string => TimeUtils.formatDate(d);

export const todayDateString = (): string => TimeUtils.todayDateString();

export function buildTechnicianOptions(
  markers: { CODIGO_TECNICO: string; NOMBRE_TECNICO: string }[],
): string[] {
  return markers.map((m) => `${m.CODIGO_TECNICO} - ${m.NOMBRE_TECNICO}`);
}

// ─── MAPA: ICONOS ─────────────────────────────────────────────────────────────

export type IconType = UIUtils.IconType;

export function checkReport(marker: {
  DESCONEXION: string;
  VELOCIDAD: string;
}): IconType {
  const reportTime = marker.DESCONEXION !== "" ? parseInt(marker.DESCONEXION) : 0;
  const velocity = marker.VELOCIDAD !== "" ? parseInt(marker.VELOCIDAD) : 0;
  if (velocity >= 5) {
    if (reportTime <= 10) return "greenVEL";
    if (reportTime <= 120) return "redVEL";
    return "blackVEL";
  }
  if (reportTime <= 10) return "green";
  if (reportTime <= 120) return "red";
  return "black";
}

export const getIconUrl = (iconType: IconType): string => UIUtils.getIconUrl(iconType);

export const getFontColorClass = (iconType: IconType): string => UIUtils.getFontColorClass(iconType);

// ─── MAPA: MÁQUINAS COCA-COLA ─────────────────────────────────────────────────

export function familiaToTime(familia: string, deltaOrigen: number): number {
  const SLA: Record<string, number> = {
    ccc: 1,
    "333003040045353": 2,
    "333003040045354": 4,
    "333003040045355": 4,
    "333003040045356": 4,
    "333003040045975": 0.75,
    "333003040045976": 0.75,
    "333003040045977": 2,
    "333003040045978": 0.75,
    A: 0.333,
    B: 0.333,
    C: 0.333,
    X: 0.333,
  };
  const sla = SLA[familia];
  return sla !== undefined ? (deltaOrigen + sla) * 24 : 18;
}

export function getMachineIconUrl(
  tiempo: number,
  actAviso: string,
  pausas: { CHIA_VOSTROORDINE: string }[],
): string {
  if (pausas.some((p) => p.CHIA_VOSTROORDINE === actAviso))
    return "./src/img/purplemachineIcon.png";
  if (tiempo > 8) return "./src/img/greenmachineIcon.png";
  if (tiempo >= 2) return "./src/img/yellowmachineIcon.png";
  if (tiempo > 0) return "./src/img/machineIcon.png";
  return "./src/img/blackmachineIcon.png";
}

// ─── MAPA: DISTANCIA ──────────────────────────────────────────────────────────

export const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => 
  GeoUtils.getDistanceKm(lat1, lon1, lat2, lon2);

// ─── MAPA: COLORES DE TÉCNICOS ────────────────────────────────────────────────

export const TECHNICIAN_COLORS = UIUtils.TECHNICIAN_COLORS;

// ─── MAPA: COORDENADAS POR ISLA ───────────────────────────────────────────────

export const getIslandCoordinates = (isla: string | null) => GeoUtils.getIslandCoordinates(isla);

// ─── MAPA: COOKIES ────────────────────────────────────────────────────────────

export const getCookie = (name: string) => CookieUtils.getCookie(name);
export const setCookie = (name: string, value: string) => CookieUtils.setCookie(name, value);
export const deleteCookie = (name: string) => CookieUtils.deleteCookie(name);
  