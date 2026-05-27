import { apiFetch } from "./api";
import { DELEGACIONES_ALL, type TecData, type TareaData } from "../utils/rankingHelpers";

export interface JornadaData {
  inicio: Date | null;
  fin: Date | null;
}

export interface JornadaRow {
  CODIGO_TECNICO?: string;
  COD_TECNICO?: string;
  FECHA_INI?: string;
  FECHA_FIN?: string;
  [key: string]: unknown;
}

function pickString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  return "";
}

function pickValueByKey(row: Record<string, unknown>, key: string): unknown {
  if (Object.prototype.hasOwnProperty.call(row, key)) return row[key];
  const upper = key.toUpperCase();
  if (Object.prototype.hasOwnProperty.call(row, upper)) return row[upper];
  const lower = key.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(row, lower)) return row[lower];
  return undefined;
}

function pickByKeys(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = pickString(pickValueByKey(row, key));
    if (value) return value;
  }
  return "";
}

function normalizarNombre(nombreRaw: string): string {
  if (!nombreRaw) return "";
  if (!nombreRaw.includes(",")) return nombreRaw;
  const partes = nombreRaw.split(",");
  return partes[1]?.trim() || nombreRaw.trim();
}

function normalizarTecnico(
  row: Record<string, unknown>,
  fallbackDelegacion: string,
): TecData | null {
  const codigo = pickByKeys(row, [
    "CODIGO_EMPLEADO",
    "CODIGO_TECNICO",
    "CODIGO",
    "COD_TECNICO",
    "COD_TEC",
    "ID_TECNICO",
    "COD_EMP",
    "CO_EMP",
    "TECNICO_CODIGO",
  ]);
  if (!codigo) return null;

  const nombre = pickByKeys(row, [
    "NOMBRE_EMPLEADO",
    "NOMBRE_TECNICO",
    "NOMBRE",
    "EMP_NOMBRE",
    "TECNICO_NOMBRE",
    "NOM_EMP",
    "TECNICO",
  ]);
  const delegacion = pickByKeys(row, [
    "CODIGO_AREA",
    "DELEGACION",
    "DELEG",
    "FILI",
    "ZONA",
    "AREA",
    "CENTRO",
  ]);

  return {
    codigo,
    nombre: normalizarNombre(nombre) || `Tecnico ${codigo}`,
    delegacion: DELEGACIONES_ALL.includes(delegacion) ? delegacion : fallbackDelegacion,
    mostrar: true,
  };
}

function normalizarTarea(row: Record<string, unknown>): TareaData | null {
  const fechaIni = pickByKeys(row, ["FECHA_INI", "FECHA_INICIO", "F_INI", "FECHA_INICIO_REAL"]);
  if (!fechaIni) return null;

  let fechaFin = pickByKeys(row, ["FECHA_FIN", "FECHA_FIN_REAL", "F_FIN", "FECHA_FIN_PREV"]);
  // Si es "000" o vacío, se considera en ejecución
  if (!fechaFin || fechaFin === "000" || fechaFin.includes("1900-01-01")) {
    fechaFin = null;
  }

  const codTecnico = pickByKeys(row, [
    "COD_TECNICO",
    "CODIGO_TECNICO",
    "CODIGO_EMPLEADO",
    "CODIGO",
    "COD_TEC",
    "COD_EMP",
    "CO_EMP",
  ]);
  const delegacion = pickByKeys(row, ["DELEGACION", "DELEG", "CODIGO_AREA", "FILI", "ZONA", "AREA"]);

  // Incluimos TAREASC para detectar "Pausa para comer" y otros códigos
  const tId = pickByKeys(row, ["TAREA", "TIPO_TAREA", "ACTIVIDAD_CODIGO", "TAREASC", "COD_TAREA"]);
  const descripcion = pickByKeys(row, ["DESCRIPCION", "DESC", "ACTIVIDAD_DESC", "TAREASC", "TAREA_DESC"]);

  const estadoTarea = pickByKeys(row, ["ESTADOTAREA", "ESTADO_TAREA", "ESTADO", "EST"]);
  const actividad = pickByKeys(row, ["ACTIVIDAD", "ACTIVIDAD_REALIZADA", "ACT"]);
  const miefChia = pickByKeys(row, ["MIEF_CHIA", "COD_LLAMADA", "AVISO", "ID_AVISO"]);
  const averiaEncontrada = pickByKeys(row, ["AVERIA_ENCONTRADA", "AVERIA", "FALLO"]);
  const cliente = pickByKeys(row, ["CLIENTE", "NOMBRE_CLIENTE", "cli"]);
  const equipo = pickByKeys(row, ["EQUIPO", "MATRICULA", "MAT"]);
  const tipo = pickByKeys(row, ["TIPO", "TIPO_AVISO", "TIPO_TAREA"]);

  return {
    ...row,
    COD_TECNICO: codTecnico || undefined,
    CODIGO_TECNICO: codTecnico || undefined,
    DELEGACION: delegacion || undefined,
    FECHA_INI: fechaIni,
    FECHA_FIN: fechaFin,
    TAREA: tId || undefined,
    DESCRIPCION: descripcion || undefined,
    ESTADOTAREA: estadoTarea || undefined,
    ACTIVIDAD: actividad || undefined,
    MIEF_CHIA: miefChia || undefined,
    AVERIA_ENCONTRADA: averiaEncontrada || undefined,
    CLIENTE: cliente || undefined,
    EQUIPO: equipo || undefined,
    TIPO: tipo || undefined,
  };
}

export async function fetchTecnicosProductividad(mainplant: string): Promise<TecData[]> {
  if (!mainplant) return [];

  const rows = await apiFetch<unknown>(
    `external-api/rank-productividad-tecnicos?mainplant=${encodeURIComponent(mainplant)}`,
  );
  if (!Array.isArray(rows)) return [];

  const fallbackDelegacion = mainplant.split("-").find(Boolean) || "6S21";
  const mapByCodigo = new Map<string, TecData>();

  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const tec = normalizarTecnico(row as Record<string, unknown>, fallbackDelegacion);
    if (!tec) continue;
    if (!mapByCodigo.has(tec.codigo)) mapByCodigo.set(tec.codigo, tec);
  }

  return [...mapByCodigo.values()].sort((a, b) => a.codigo.localeCompare(b.codigo));
}

export async function fetchTecnicosProductividadV125(mainplant: string): Promise<TecData[]> {
  if (!mainplant) return [];

  const rows = await apiFetch<unknown>(
    `external-api/productividad-tecnicos?mainplant=${encodeURIComponent(mainplant)}`,
  );
  if (!Array.isArray(rows)) return [];

  const fallbackDelegacion = mainplant.split("-").find(Boolean) || "6S21";
  const mapByCodigo = new Map<string, TecData>();

  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const tec = normalizarTecnico(row as Record<string, unknown>, fallbackDelegacion);
    if (!tec) continue;
    if (!mapByCodigo.has(tec.codigo)) mapByCodigo.set(tec.codigo, tec);
  }

  return [...mapByCodigo.values()].sort((a, b) => a.codigo.localeCompare(b.codigo));
}

export async function fetchTareasProductividad(
  mainplant: string,
  fechaInicio: string,
  fechaFin: string,
): Promise<TareaData[]> {
  if (!mainplant || !fechaInicio || !fechaFin) return [];

  const url =
    `external-api/productividad-tareas?mainplant=${encodeURIComponent(mainplant)}` +
    `&fechaInicio=${encodeURIComponent(fechaInicio)}` +
    `&fechaFin=${encodeURIComponent(fechaFin)}`;

  const rows = await apiFetch<unknown>(url);
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      return normalizarTarea(row as Record<string, unknown>);
    })
    .filter((row): row is TareaData => Boolean(row));
}

export async function fetchJornadasProductividad(
  mainplant: string,
  fechaInicio: string,
  fechaFin: string,
): Promise<JornadaRow[]> {
  if (!mainplant || !fechaInicio || !fechaFin) return [];

  const url =
    `external-api/productividad-jornadas?mainplant=${encodeURIComponent(mainplant)}` +
    `&fechaInicio=${encodeURIComponent(fechaInicio)}` +
    `&fechaFin=${encodeURIComponent(fechaFin)}`;

  const rows = await apiFetch<unknown>(url);
  if (!Array.isArray(rows)) return [];

  return rows.filter((row): row is JornadaRow => Boolean(row) && typeof row === "object");
}

export async function fetchDetalleTecnicos(codTecnico: string, fechaInicio: string, fechaFin: string, mainplant: string): Promise<TecData[]> {
  if (!codTecnico) return [];
  const url = `external-api/detalle-tecnicos?codTecnico=${encodeURIComponent(codTecnico)}&fechaInicio=${encodeURIComponent(fechaInicio)}&fechaFin=${encodeURIComponent(fechaFin)}&mainplant=${encodeURIComponent(mainplant)}`;
  const rows = await apiFetch<unknown>(url);
  if (!Array.isArray(rows)) return [];
  const fallbackDelegacion = mainplant.split("-")[0] || "6S21";
  const mapByCodigo = new Map<string, TecData>();
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const tec = normalizarTecnico(row as Record<string, unknown>, fallbackDelegacion);
    if (tec && !mapByCodigo.has(tec.codigo)) mapByCodigo.set(tec.codigo, tec);
  }
  return [...mapByCodigo.values()].sort((a, b) => a.codigo.localeCompare(b.codigo));
}

export async function fetchDetalleTareas(codTecnico: string, fechaInicio: string, fechaFin: string, mainplant: string): Promise<TareaData[]> {
  if (!codTecnico || !fechaInicio || !fechaFin || !mainplant) return [];
  const url = `external-api/detalle-tareas?codTecnico=${encodeURIComponent(codTecnico)}&fechaInicio=${encodeURIComponent(fechaInicio)}&fechaFin=${encodeURIComponent(fechaFin)}&mainplant=${encodeURIComponent(mainplant)}`;
  const rows = await apiFetch<unknown>(url);
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => row && typeof row === "object" ? normalizarTarea(row as Record<string, unknown>) : null).filter((row): row is TareaData => Boolean(row));
}

export async function fetchDetalleJornadas(codTecnico: string, fechaInicio: string, fechaFin: string, mainplant: string): Promise<JornadaRow[]> {
  if (!codTecnico || !fechaInicio || !fechaFin || !mainplant) return [];
  const url = `external-api/detalle-jornadas?codTecnico=${encodeURIComponent(codTecnico)}&fechaInicio=${encodeURIComponent(fechaInicio)}&fechaFin=${encodeURIComponent(fechaFin)}&mainplant=${encodeURIComponent(mainplant)}`;
  const rows = await apiFetch<unknown>(url);
  if (!Array.isArray(rows)) return [];
  return rows.filter((row): row is JornadaRow => Boolean(row) && typeof row === "object");
}
  