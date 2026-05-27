export type RowLike = Record<string, unknown>;

const DEFAULT_DELEGACION_KEYS = ["delegacion", "DELEGACION", "DELEG", "FILI", "FILIAL"] as const;
const DEFAULT_CODIGO_KEYS = ["codigo", "CODIGO", "AVISO", "aviso"] as const;

export function pickFirstTextValue(row: RowLike, keys: readonly string[]): string {
    for (const key of keys) {
        const value = row[key];
        if (value !== null && value !== undefined) {
            const text = String(value).trim();
            if (text !== "") return text;
        }
    }
    return "";
}

export function normalizeDelegacion(
    row: RowLike,
    keys: readonly string[] = DEFAULT_DELEGACION_KEYS,
): string {
    return pickFirstTextValue(row, keys).toUpperCase();
}

export function normalizeCodigo(
    row: RowLike,
    delegacion: string,
    index: number,
    keys: readonly string[] = DEFAULT_CODIGO_KEYS,
): string {
    return pickFirstTextValue(row, keys) || `${delegacion}-${index}`;
}
  