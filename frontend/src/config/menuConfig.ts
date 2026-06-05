export interface VistaConfig {
    codigo: string;
    nombre: string;
    mostrar_juntas: number | boolean;
    param_key?: string | null;
    joiner?: string | null;
}

export interface VistaUrl {
    region_codigo: string;
    vista_codigo: string;
    url: string;
}

export interface VistaIsla {
    region_codigo: string;
    vista_codigo: string;
    label: string;
    mainplant: string;
    orden?: number;
}

export interface MenuConfig {
    vistas: VistaConfig[];
    vistaUrls: VistaUrl[];
    vistaIslas: VistaIsla[];
}

export interface MenuMaps {
    vistaByCode: Record<string, VistaConfig>;
    urlByRegionVista: Record<string, string>;
    islandsByRegionVista: Record<string, VistaIsla[]>;
}

export function buildMenuMaps(menu: MenuConfig): MenuMaps {
    const vistaByCode: Record<string, VistaConfig> = {};
    for (const v of menu.vistas || []) vistaByCode[v.codigo] = v;

    const urlByRegionVista: Record<string, string> = {};
    for (const u of menu.vistaUrls || []) {
        urlByRegionVista[`${u.region_codigo}|${u.vista_codigo}`] = u.url;
    }

    const islandsByRegionVista: Record<string, VistaIsla[]> = {};
    for (const i of menu.vistaIslas || []) {
        const key = `${i.region_codigo}|${i.vista_codigo}`;
        if (!islandsByRegionVista[key]) islandsByRegionVista[key] = [];
        islandsByRegionVista[key].push(i);
    }

    for (const key of Object.keys(islandsByRegionVista)) {
        islandsByRegionVista[key].sort((a, b) => {
            const ao = Number.isFinite(a.orden) ? (a.orden as number) : 0;
            const bo = Number.isFinite(b.orden) ? (b.orden as number) : 0;
            return ao - bo;
        });
    }

    return { vistaByCode, urlByRegionVista, islandsByRegionVista };
}

export function appendQueryParam(url: string, key: string, value: string): string {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}${key}=${encodeURIComponent(value)}`;
}
  