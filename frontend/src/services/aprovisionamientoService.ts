import { apiFetch } from "./api";

export interface Repuesto {
  CODIGO_REPUESTO: string;
  NOMBRE_REPUESTO: string;
  IMAGEN?: string;
  NOMBRE_CATEGORIA?: string;
}

export interface Existencia {
  CODIGO_REPUESTO: string;
  CANTIDAD_ACTUAL?: number | null;
  STOCK_MINIMO?: number | null;
  STOCK_MAXIMO?: number | null;
  PRIORIDAD?: string;
}

export async function fetchRepuestosCatalog(): Promise<Repuesto[]> {
  try {
    const data = await apiFetch<unknown>("external-api/135");
    if (!Array.isArray(data)) {
      console.error("fetchRepuestosCatalog: data is not an array:", data);
      return [];
    }
    return data as Repuesto[];
  } catch (error) {
    console.error("Error fetching catalog: ", error);
    throw error;
  }
}

export async function fetchExistencias(codAlmacen: string): Promise<Existencia[]> {
  try {
    const endpoint = codAlmacen === "102" ? "143" : "136";
    const data = await apiFetch<unknown>(`external-api/${endpoint}`);
    if (!Array.isArray(data)) {
      console.error(`fetchExistencias(${endpoint}): data is not an array:`, data);
      return [];
    }
    return data as Existencia[];
  } catch (error) {
    console.error("Error fetching existencias: ", error);
    throw error;
  }
}
export interface Inventario {
  CODIGO_REPUESTO: string;
  FECHA_INVENTARIO: string;
}

export async function fetchInventario(codAlmacen: string): Promise<Inventario[]> {
  try {
    const endpoint = `external-api/137?codAlmacen=${encodeURIComponent(codAlmacen)}`;
    const data = await apiFetch<unknown>(endpoint);
    if (!Array.isArray(data)) {
      console.error(`fetchInventario(137|${codAlmacen}): data is not an array:`, data);
      return [];
    }
    return data as Inventario[];
  } catch (error) {
    console.error("Error fetching inventario: ", error);
    throw error;
  }
}
  