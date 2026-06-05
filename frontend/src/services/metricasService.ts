import { apiFetch } from "./api";
import type { AllMetricas } from "./Types";
import { obtenerRangoSemanaActual, obtenerRangoMesActual, obtenerRangoAnioActual } from "../config/regionConfig";

export async function fetchMetricas(mainplant: string): Promise<AllMetricas> {
  const semana = obtenerRangoSemanaActual();
  const mes = obtenerRangoMesActual();
  const anio = obtenerRangoAnioActual();
  return apiFetch(`external-api/metricas?mainplant=${mainplant}&semana=${semana}&mes=${mes}&anio=${anio}`);
}
  