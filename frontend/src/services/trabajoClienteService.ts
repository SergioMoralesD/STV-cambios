import { apiFetch } from "./api";
import { normalizeCodigo, normalizeDelegacion } from "./rowNormalizer";

export async function fetchTrabajoCliente(mainplant: string): Promise<Record<string, unknown>[]> {
    const data = await apiFetch<Record<string, unknown>[]>(`external-api/trabajo-cliente?mainplant=${mainplant}`);

    if (!Array.isArray(data)) return [];

    return data.map((row, index) => {
        const delegacion = normalizeDelegacion(row);
        const codigo = normalizeCodigo(row, delegacion, index);

        return {
            ...row,
            delegacion,
            codigo,
        };
    });
}
  