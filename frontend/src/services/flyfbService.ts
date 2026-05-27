import { apiFetch } from "./api";

export interface FlyFBItem {
    [key: string]: unknown;
    delegacion: string;
    codigo: string;
    familiaRaw: string;
    tipoAvisoRaw: string;
    tipoLabel: string;
    avisoLabel: string;
    counterLabel: string;
    clienteLabel: string;
    estadoLabel: string;
}

const DELEGACION_KEYS = ["delegacion", "DELEGACION", "DELEG", "FILI", "FILIAL"] as const;
const CODIGO_KEYS = ["codigo", "CODIGO", "AVISO", "aviso", "CHIA_VOSTROORDINE", "N_AVISO"] as const;
const FAMILIA_KEYS = ["FAMILIA", "familia", "SUBFAMILIA", "subfamilia", "COD_SUBFAMILIA", "cod_subfamilia"] as const;
const TIPO_KEYS = ["TIPO_AVISO", "tipo_aviso", "TIPO", "tipo", "CLASE", "clase"] as const;
const CLIENTE_KEYS = ["CLIENTE", "cliente", "NOMBRE_CLIENTE", "nombre_cliente", "NOMBRE", "nombre", "DESCRIPCION", "descripcion"] as const;
const COUNTER_KEYS = ["NIVEL", "nivel", "DIFERENCIA", "diferencia", "REPETICIONES", "repeticiones", "RN", "rn"] as const;
const ESTADO_KEYS = ["ESTADO", "estado", "nombre_estado", "NOMBRE_ESTADO", "USERSTATUS", "userstatus", "DESCRIPCION_ESTADO"] as const;

const pickFirstValue = (row: Record<string, unknown>, keys: readonly string[]): string => {
    for (const key of keys) {
        const value = row[key];
        if (value !== null && value !== undefined) {
            const text = String(value).trim();
            if (text !== "") return text;
        }
    }
    return "";
};

export async function fetchFlyFB(mainplant: string): Promise<FlyFBItem[]> {
    const data = await apiFetch<Record<string, unknown>[]>(`external-api/fly-fb?mainplant=${mainplant}`);

    if (!Array.isArray(data)) return [];

    return data.map((row, index) => {
        const delegacion = pickFirstValue(row, DELEGACION_KEYS).toUpperCase();
        const codigo = pickFirstValue(row, CODIGO_KEYS) || `${delegacion}-${index}`;
        const familiaRaw = pickFirstValue(row, FAMILIA_KEYS);
        const tipoAvisoRaw = pickFirstValue(row, TIPO_KEYS);
        const tipoLabel = tipoAvisoRaw || "FL";
        const avisoLabel = pickFirstValue(row, CODIGO_KEYS) || codigo;
        const counterLabel = pickFirstValue(row, COUNTER_KEYS) || "0";
        const clienteLabel = pickFirstValue(row, CLIENTE_KEYS) || "-";
        const estadoLabel = pickFirstValue(row, ESTADO_KEYS) || "";

        return {
            ...row,
            delegacion,
            codigo,
            familiaRaw,
            tipoAvisoRaw,
            tipoLabel,
            avisoLabel,
            counterLabel,
            clienteLabel,
            estadoLabel,
        };
    });
}
  