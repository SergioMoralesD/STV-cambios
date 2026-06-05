// src/config/regionConfig.ts

// ─── Constantes API ───────────────────────────────────────────────────────
export const MAP_API_KEY = "";

// ─── Tipos ────────────────────────────────────────────────────────────────
export type Region = "C" | "B";

export type RegionPermitida = { codigo?: string | null; nombre?: string | null };
export type DelegacionesPorRegion = Record<string, Record<string, string[]>>;
export type ResolverMainplantModo = "estricto" | "filtrado";
export type IslaColumna = {
    id: string;
    label: string;
    mainplant: string;
    img: string;
};
export type IslaMeta = {
    nombre: string;
    nombreCorto: string;
    img: string;
    region: Region;
    orden: number;
};

const REGIONES_VALIDAS: Region[] = ["C", "B"];
const REGIONES_SET = new Set<Region>(REGIONES_VALIDAS);
const ORDEN_ISLAS_C = ["6S21", "6S23", "6S24", "6S25", "6S21_MENORES"];
const ORDEN_ISLAS_B = ["6E21", "6E22", "6E23", "6E41"];
const ORDEN_ISLAS = [...ORDEN_ISLAS_C, ...ORDEN_ISLAS_B];
const ORDEN_INDEX = new Map(ORDEN_ISLAS.map((code, index) => [code, index]));

const ISLA_META_MAP: Record<string, IslaMeta> = {
    "6S21": { nombre: "Tenerife", nombreCorto: "TF", img: "tf", region: "C", orden: 0 },
    "6S23": { nombre: "Gran Canaria", nombreCorto: "GC", img: "gc", region: "C", orden: 1 },
    "6S24": { nombre: "Lanzarote", nombreCorto: "LZ", img: "lz", region: "C", orden: 2 },
    "6S25": { nombre: "Fuerteventura", nombreCorto: "FV", img: "fv", region: "C", orden: 3 },
    "6S21_MENORES": { nombre: "Islas Menores", nombreCorto: "IM", img: "im", region: "C", orden: 4 },
    "6E21": { nombre: "Mallorca", nombreCorto: "PM", img: "pm", region: "B", orden: 5 },
    "6E22": { nombre: "Ibiza", nombreCorto: "IB", img: "ib", region: "B", orden: 6 },
    "6E23": { nombre: "Menorca", nombreCorto: "ME", img: "me", region: "B", orden: 7 },
    "6E41": { nombre: "Formentera", nombreCorto: "FT", img: "ft", region: "B", orden: 8 },
};

export function esRegion(codigo: string | null | undefined): codigo is Region {
    return Boolean(codigo && REGIONES_SET.has(codigo as Region));
}

export function obtenerRegionActual(
    selectedRegion: string | null | undefined,
    regionesUsuario?: RegionPermitida[]
): Region {
    if (esRegion(selectedRegion)) return selectedRegion;
    const primera = regionesUsuario?.[0]?.codigo;
    if (esRegion(primera)) return primera;
    return "C";
}

export function obtenerNombreRegion(region: string | null | undefined): string {
    if (region === "C") return "Canarias";
    if (region === "B") return "Baleares";
    return "";
}

export function obtenerDelegacionesVista(
    delegaciones: DelegacionesPorRegion | undefined,
    region: Region,
    vistaCodigo: string
): string[] {
    return delegaciones?.[region]?.[vistaCodigo] || [];
}

export function resolverMainplant({
    seleccion,
    permitidas,
    modo = "estricto",
    devolverNullSinPermitidas = false,
}: {
    seleccion: string | null | undefined;
    permitidas: string[];
    modo?: ResolverMainplantModo;
    devolverNullSinPermitidas?: boolean;
}): string | null {
    if (devolverNullSinPermitidas && permitidas.length === 0) {
        return null;
    }

    const esSeleccionVacia = !seleccion || seleccion === "C" || seleccion === "B";
    if (esSeleccionVacia) {
        return permitidas.join("-");
    }

    const solicitadas = seleccion.split("-").filter(Boolean);
    
    // [MOD] Inyectamos virtualmente 6S21_MENORES si el usuario tiene Tenerife (6S21)
    // para que la validación estricta no falle al pedir el grupo agrupado.
    const permitidasFinales = [...permitidas];
    if (permitidas.includes("6S21") && !permitidas.includes("6S21_MENORES")) {
        permitidasFinales.push("6S21_MENORES");
    }

    if (modo === "estricto") {
        const hayNoAutorizadas = solicitadas.some((code) => !permitidasFinales.includes(code));
        if (hayNoAutorizadas) {
            return null;
        }
        return seleccion;
    }

    const autorizadas = solicitadas.filter((code) => permitidasFinales.includes(code));
    if (autorizadas.length === 0) {
        return null;
    }

    return autorizadas.join("-");
}

export function getFamilyColorClass(familyCode: string): string {
    return getClaseFamilia(familyCode, familyCode)[1];
}

export function getFechaHoyISO(): string {
    return new Date().toISOString().split("T")[0];
}

export function getFechaHaceUnMesISO(): string {
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() - 1);
    return fecha.toISOString().split("T")[0];
}

export function formatearFechaParaAPI(fechaStr: string): string {
    const fecha = new Date(fechaStr);
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, "0");
    const day = String(fecha.getDate()).padStart(2, "0");
    return `${year}${month}${day}000000`;
}

export function parseMpsConImagenes(mps: string, islaImg: Record<string, string>) {
    const codes = extraerDelegacionesDesdeMainplant(mps);
    return codes
        .map((mp) => ({ mainplant: mp, is: islaImg[mp] || "tf" }))
        .filter((mp) => mp.mainplant);
}

export function obtenerMetaIslas(): Record<string, IslaMeta> {
    return ISLA_META_MAP;
}

export function obtenerNombreIsla(codigo: string, usarNombreCorto = false): string {
    const meta = ISLA_META_MAP[codigo];
    if (!meta) return codigo;
    return usarNombreCorto ? meta.nombreCorto : meta.nombre;
}

export function obtenerImagenIsla(codigo: string): string {
    return ISLA_META_MAP[codigo]?.img || "default";
}

export function normalizarDelegacionesOrden(codigos: string[]): string[] {
    const unicos = Array.from(new Set((codigos || []).filter(Boolean)));
    return unicos.sort((a, b) => {
        const ia = ORDEN_INDEX.has(a) ? (ORDEN_INDEX.get(a) as number) : Number.MAX_SAFE_INTEGER;
        const ib = ORDEN_INDEX.has(b) ? (ORDEN_INDEX.get(b) as number) : Number.MAX_SAFE_INTEGER;
        if (ia !== ib) return ia - ib;
        return a.localeCompare(b);
    });
}

export function extraerDelegacionesDesdeMainplant(mainplant: string): string[] {
    const tokens = (mainplant || "")
        .split("-")
        .map((v) => v.trim())
        .filter(Boolean);
    const expanded: string[] = [];

    for (const token of tokens) {
        if (token === "C") {
            expanded.push(...ORDEN_ISLAS_C);
            continue;
        }
        if (token === "B") {
            expanded.push(...ORDEN_ISLAS_B);
            continue;
        }
        expanded.push(token);
    }

    if (expanded.includes("6S21") && !expanded.includes("6S21_MENORES")) {
        expanded.push("6S21_MENORES");
    }

    return normalizarDelegacionesOrden(expanded);
}

export function obtenerColumnasIsla(mainplant: string): string[] {
    return extraerDelegacionesDesdeMainplant(mainplant);
}

export function obtenerColumnasIslaObjetos(mainplant: string, userRole?: string): IslaColumna[] {
    return obtenerColumnasAgrupadas(mainplant, userRole);
}

export function obtenerColumnasAgrupadas(mainplant: string, userRole?: string): IslaColumna[] {
    const codigos = extraerDelegacionesDesdeMainplant(mainplant);

    // Default individual columns without grouping
    return codigos.map((codigo) => ({
        id: codigo,
        mainplant: codigo,
        label: obtenerNombreIsla(codigo),
        img: obtenerImagenIsla(codigo),
    }));
}

// ─── Helpers de fecha (VITALES para los parámetros de la API) ──────────────

function formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, "0");
    const day = String(fecha.getDate()).padStart(2, "0");
    const hours = String(fecha.getHours() || 0).padStart(2, "0");
    const minutes = String(fecha.getMinutes() || 0).padStart(2, "0");
    const seconds = String(fecha.getSeconds() || 0).padStart(2, "0");
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

export function formatearFechaVisual(fechaISO: string): string {
    try {
        if (!fechaISO) return "";
        const fecha = new Date(fechaISO);
        if (isNaN(fecha.getTime())) return String(fechaISO || "");
        const dia = String(fecha.getDate()).padStart(2, "0");
        const mes = String(fecha.getMonth() + 1).padStart(2, "0");
        return `${dia}-${mes}-${fecha.getFullYear()}`;
    } catch {
        return String(fechaISO || "");
    }
}

export function obtenerRangoSemanaActual(): string {
    const hoy = new Date();
    const diaSemana = hoy.getDay() === 0 ? 7 : hoy.getDay();
    const inicio = new Date(hoy);
    inicio.setDate(hoy.getDate() - (diaSemana - 1));
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(hoy);
    fin.setDate(hoy.getDate() + 1);
    fin.setHours(0, 0, 0, 0);
    return `${formatearFecha(inicio)}|${formatearFecha(fin)}`;
}

export function obtenerRangoMesActual(): string {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const fin = new Date(hoy);
    fin.setDate(hoy.getDate() + 1);
    fin.setHours(0, 0, 0, 0);
    return `${formatearFecha(inicio)}|${formatearFecha(fin)}`;
}

export function obtenerRangoAnioActual(): string {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), 0, 1);
    const fin = new Date(hoy);
    fin.setDate(hoy.getDate() + 1);
    fin.setHours(0, 0, 0, 0);
    return `${formatearFecha(inicio)}|${formatearFecha(fin)}`;
}

// ─── Helper familia/clase ─────────────────────────────────────────────────

type FamiliaRule = {
    familiaText: string;
    claseFamilia: string;
    codes?: string[];
    tipos?: string[];
};

const DEFAULT_FAMILIA_RULES: FamiliaRule[] = [
    {
        familiaText: "DI",
        claseFamilia: "colorDispensing",
        codes: ["333003040045975", "333003040045976", "333003040045978", "DI", "DISPENSING", "CA"],
        tipos: ["HA", "HI", "HC", "HR", "HT"],
    },
    {
        familiaText: "VI",
        claseFamilia: "colorVitrina",
        codes: ["333003040045353", "VI", "VITRINA"],
    },
    {
        familiaText: "VE",
        claseFamilia: "colorVending",
        codes: ["333003040045977", "VE", "VENDING"],
    },
    {
        familiaText: "BO",
        claseFamilia: "colorBotellero",
        codes: ["333003040045354", "333003040045355", "333003040045356", "BO", "BOTELLERO"],
    },
];

const DEFAULT_FAMILIA_FALLBACK: [string, string] = ["DI", "colorDispensing"];

export function getClaseFamilia(
    codSubfamilia: string,
    tipoAviso: string,
    rules: FamiliaRule[] = DEFAULT_FAMILIA_RULES,
    fallback: [string, string] = DEFAULT_FAMILIA_FALLBACK
): [string, string] {
    const codRaw = (codSubfamilia || "").toString().trim().toUpperCase();
    const cod = codRaw.replace(/\s+/g, "");
    const codSinDecimal = cod.replace(/\.0+$/, "");
    const tipo = (tipoAviso || "").toString().trim().toUpperCase();

    for (const rule of rules) {
        const codes = (rule.codes ?? []).map((c) =>
            c.toString().trim().toUpperCase().replace(/\s+/g, "").replace(/\.0+$/, "")
        );
        const tipos = (rule.tipos ?? []).map(t => t.toUpperCase());
        if (codes.includes(cod) || codes.includes(codSinDecimal) || tipos.includes(tipo)) {
            return [rule.familiaText, rule.claseFamilia];
        }
    }

    return fallback;
}
  