// src/Components/common/AgendaSemanal/helpers.ts

export function getWeekRangeForOffset(offset: number): { lunes: Date; viernes: Date } {
  const hoy = new Date();
  const diaSemana = hoy.getDay() === 0 ? 7 : hoy.getDay();
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - (diaSemana - 1) + offset * 7);
  lunes.setHours(0, 0, 0, 0);
  const viernes = new Date(lunes);
  viernes.setDate(lunes.getDate() + 4);
  viernes.setHours(23, 59, 59, 999);
  return { lunes, viernes };
}

export function getWeekDays(lunes: Date): Date[] {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return d;
  });
}

export function toISODateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function formatVisual(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
}
  