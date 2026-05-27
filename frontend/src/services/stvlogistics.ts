import { apiFetch } from "./api";
import { obtenerRangoSemanaActual, obtenerRangoMesActual, obtenerRangoAnioActual } from "../config/regionConfig";
import type { LogisticsFullResponse, LogisticsDashboardResponse } from "./Types";

export async function fetchLogisticsFull(mainplant: string): Promise<LogisticsFullResponse> {
  const semana = obtenerRangoSemanaActual();
  const mes = obtenerRangoMesActual();
  const anio = obtenerRangoAnioActual();
  
  return apiFetch(`external-api/logistics-full?mainplant=${mainplant}&semana=${semana}&mes=${mes}&anio=${anio}`);
}

export async function fetchLogisticsDashboard(mainplant: string): Promise<LogisticsDashboardResponse> {
  return apiFetch(`external-api/logistics-dashboard?mainplant=${mainplant}`);
}
  