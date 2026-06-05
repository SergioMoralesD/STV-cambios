import { apiFetch } from "./api";

// ─── INTERFACES ─────────────────────────────────────────────────────

// 41 → Pausas
export interface PausaOrden {
    CHIA_VOSTROORDINE: string;
    CODIGO_PAUSA: number;
}

// 70 → Posición técnico
export interface PosicionTecnico {
    LATITUD: number;
    LONGITUD: number;
    FECHA: string;
    VELOCIDAD: string;
    CODIGO_TECNICO: string;
    NOMBRE_TECNICO: string;
    MATRICULA: string;
    MAX_GPU_DATA: string;
    DESCONEXION: string;
}

// 68 → Avisos
export interface Aviso {
    AVISO: string;
    NOMBRE_CLIENTE: string;
    NOMBRE_CLIENTE2: string;
    CLI_CIT: string;
    CODIGO_TECNICO: string;
    AGE_NOME: string;
    FAMILIA: string;
    TIPO_AVISO: string;
    USTATUS: number;
    LATITUD: string | number;
    LONGITUD: string | number;
    DELTA_ORIGEN: number;
}

export interface AreaData {
    cod_tecnico: string;
    type: string;
    latLngs: [number, number][] | number[][];
    area: number;
}

export interface STVTrackerResponse {
    markers: PosicionTecnico[];
    aCocaCola: Aviso[];
    pausasCocaCola: PausaOrden[];
}

export async function fetchMapSnapshot(mainplant: string): Promise<STVTrackerResponse> {
    const data = await apiFetch<{
        markers?: Record<string, unknown>[];
        aCocaCola?: Record<string, unknown>[];
        pausasCocaCola?: PausaOrden[];
    }>(`external-api/mapa-snapshot?mainplant=${mainplant}`);

    if (!data) return { markers: [], aCocaCola: [], pausasCocaCola: [] };

    return {
        markers: (data.markers || []).map((m) => ({
            ...m,
            CODIGO_TECNICO: String(m.CODIGO_TECNICO || ""),
            DESCONEXION: String(m.DESCONEXION ?? ""),
            VELOCIDAD: String(m.VELOCIDAD ?? ""),
            LATITUD: Number(m.LATITUD || 0),
            LONGITUD: Number(m.LONGITUD || 0)
        } as PosicionTecnico)),
        aCocaCola: (data.aCocaCola || []).map((a) => ({
            ...a,
            CODIGO_TECNICO: String(a.CODIGO_TECNICO || ""),
            LATITUD: (a.LATITUD as string | number) ?? 0,
            LONGITUD: (a.LONGITUD as string | number) ?? 0
        } as Aviso)),
        pausasCocaCola: data.pausasCocaCola || [],
    };
}

export interface AvisoCompleto {
    aviso: string;
    cliente: string;
    tecnico: {
        codigo: number;
        nombre: string;
    };
    ubicacion: {
        lat: number;
        lng: number;
    };
    estado: number;
    pausa?: number;
}  