import { apiFetch } from "./api";
import type { AveriaData, ResumenData, Redisposiciones, Sanitizacion, AvisoLimpieza, AveriaSLA } from "./Types";
import { normalizeCodigo, normalizeDelegacion } from "./rowNormalizer";

// --- Tipos para Averías Repetitivas ---
export interface AveriaActividad {
  ACTIVIDAD: string;
  DESC: string;
  NOTA: string | null;
}

export interface AveriaIntervencion {
  FECHA_INTERV: string;
  AVERIA_ENCONTRADA: string;
  AVERIA_ENCONTRADA_DESC: string;
  TECNICO_COD: string;
  TECNICO_NOM: string;
  NOTAS: string | null;
  ACTIVIDADES: AveriaActividad[];
}

export interface AveriaCompleta {
  FECHA_AVISO: string;
  AVERIA_DECLARADA_DESC: string;
  INTERVENCIONES: AveriaIntervencion[];
}

export interface MachineData {
  fili: string;
  cuenta7: number;
  cuenta30: number;
  cuenta365: number;
  machine_familia: string;
  matricula_original: string;
  cliente_actual: string;
  matricula: string;
  averias_text: string;
  [key: string]: unknown;
}

// --- Consultas Generales ---

export async function fetchAveriasYTecnicos(mainplant: string): Promise<AveriaData> {
  return apiFetch(`external-api/averias-tecnicos?mainplant=${mainplant}`);
}

export async function fetchResumen(mainplant: string): Promise<ResumenData> {
  return apiFetch(`external-api/tablaresumen?mainplant=${mainplant}`);
}

export async function fetchTecnicosNecesarios(mainplant: string, slaObjetivo: number): Promise<number | "Error"> {
  return apiFetch(`external-api/tecnicos-necesarios?mainplant=${mainplant}&slaObjetivo=${slaObjetivo}`);
}

// --- Averías SLA ---

export async function fetchAveriasSLA(mainplant: string): Promise<AveriaSLA[]> {
  const data = await apiFetch<Record<string, unknown>[]>(`external-api/averias-sla?mainplant=${mainplant}`);
  if (!Array.isArray(data)) return [];

  return data.map((row, index) => {
    const delegacion = normalizeDelegacion(row);
    const codigo = normalizeCodigo(row, delegacion, index);
    return { ...row, delegacion, codigo } as AveriaSLA;
  });
}

export async function fetchSlaObjetivo(mainplant: string): Promise<{ sla_objetivo: number }> {
  return apiFetch(`external-api/sla-objetivo?mainplant=${mainplant}`);
}

export async function setSlaObjetivoAPI(mainplant: string, sla: number) {
  return apiFetch(`external-api/sla-objetivo`, {
    method: "POST",
    body: JSON.stringify({ mainplant, sla })
  });
}

// --- Averías Repetitivas ---

export async function fetchAveriasRepetitivas(mainplant: string): Promise<MachineData[]> {
  return apiFetch(`external-api/averias-repetitivas?mainplant=${mainplant}`);
}

export async function fetchAveriasRepetitivasAno(mainplant: string): Promise<MachineData[]> {
  return apiFetch(`external-api/averias-repetitivas-ano?mainplant=${mainplant}`);
}

export async function fetchAveriasRepetitivasLegacy(mainplant: string): Promise<Redisposiciones[]> {
  return apiFetch(`external-api/averias-repetitivas?mainplant=${mainplant}`);
}

// --- Mantenimiento ---

export async function fetchMaintenance(mainplant: string, mainplantStr?: string, filter?: string): Promise<{ sanitizaciones: Sanitizacion[], avisos: AvisoLimpieza[] }> {
  let url = `external-api/maintenance?mainplant=${mainplant}`;
  if (mainplantStr) url += `&mainplantStr=${mainplantStr}`;
  if (filter) url += `&filter=${filter}`;
  return apiFetch(url);
}

// Backwards-compatible alias
export async function fetchDailyMaintenance(mainplant: string, mainplantStr?: string, filter?: string): Promise<{ sanitizaciones: Sanitizacion[], avisos: AvisoLimpieza[] }> {
  return fetchMaintenance(mainplant, mainplantStr, filter);
}
  