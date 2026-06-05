// src/services/consumoService.ts
import { apiFetch } from "./api";

export interface ConsumoAlmacenItem {
  FECHA_MOVIMIENTO: string;
  CODIGO_REPUESTO: string;
  NOMBRE_REPUESTO: string;
  PRECIO_ESTANDAR: string | number;
  CANTIDAD_MOV: string | number;
  COSTE_TOTAL: string | number;
  DESTINATARIO: string;
}

/**
 * Petición 146 — Consumo de almacén por rango de fechas.
 * codAlm: "101" = Canarias, "102" = Baleares
 * fechaIni / fechaFin: formato YYYYMMDDHHmmss
 */
export async function fetchConsumoAlmacen(
  codAlm: string,
  fechaIni: string,
  fechaFin: string
): Promise<ConsumoAlmacenItem[]> {
  const data = await apiFetch<unknown>(
    `external-api/146?codAlm=${encodeURIComponent(codAlm)}&fechaIni=${encodeURIComponent(fechaIni)}&fechaFin=${encodeURIComponent(fechaFin)}`
  );
  if (!Array.isArray(data)) {
    console.error("fetchConsumoAlmacen (146): respuesta no es un array:", data);
    return [];
  }
  return data as ConsumoAlmacenItem[];
}
  