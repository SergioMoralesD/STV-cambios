const FECHA_INVALIDA_TOKEN = "1900-01-01";

/**
 * Formatea una fecha a YYYYMMDDHHmmss
 */
export function formatearFecha(fecha: Date): string {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");
  const hours = String(fecha.getHours()).padStart(2, "0");
  const minutes = String(fecha.getMinutes()).padStart(2, "0");
  const seconds = String(fecha.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Parsea una fecha en formato string (ISO o similar) a Date
 */
export function parseFecha(raw: string | null | undefined): Date | null {
  if (!raw || raw.includes(FECHA_INVALIDA_TOKEN)) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Obtiene la fecha/hora de una zona, devolviendo NaN si es inválida
 */
export function getFechaHoraZona(fechaRaw: string | null | undefined): Date {
  const parsed = parseFecha(fechaRaw);
  return parsed ?? new Date(Number.NaN);
}

/**
 * Calcula la duración de una tarea en minutos
 */
export function getDuracionTarea(
  fechaIniRaw: string | null | undefined,
  fechaFinRaw: string | null | undefined,
  _delegacion?: string // Reservado para lógica futura por zona horaria
): number {
  const inicio = parseFecha(fechaIniRaw);
  if (!inicio) return 0;

  let fin = parseFecha(fechaFinRaw);
  if (!fin) {
    const ahora = new Date();
    if (inicio.getTime() <= ahora.getTime()) {
      fin = ahora;
    } else {
      fin = inicio;
    }
  }

  const diferencia = fin.getTime() - inicio.getTime();
  if (!Number.isFinite(diferencia) || diferencia <= 0) return 0;

  return diferencia / 60000;
}

/**
 * Formato de duración: "HHh MM'"
 */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null || isNaN(Number(minutes))) return "00h 00'";
  const total = Math.round(Number(minutes));
  const sign = total < 0 ? "-" : "";
  const absMinutes = Math.abs(total);
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;
  return `${sign}${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}'`;
}

/**
 * Formato de duración extendido: "Xd Yh"
 */
export function formatDaysHours(inputSeconds: number | null | undefined): string {
  if (inputSeconds == null || isNaN(Number(inputSeconds))) return "0d 0h";
  const seconds = Math.abs(Math.round(Number(inputSeconds)));
  const secondsInADay = 86400;
  const secondsInAnHour = 3600;
  const days = Math.floor(seconds / secondsInADay);
  const hours = Math.floor((seconds % secondsInADay) / secondsInAnHour);
  const sign = Number(inputSeconds) < 0 ? "-" : "";
  return `${sign}${days}d ${hours}h`;
}

/**
 * Formato YYYY-MM-DD HH:mm:ss
 */
export function formatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

/**
 * String de la fecha de hoy YYYY-MM-DD
 */
export function todayDateString(): string {
  const hoy = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}`;
}
  