// src/webs/Averias/textParse.ts
// Equivalente directo a textParse.js - parsers de los campos de texto de la API

export interface Actividad {
    cod: string | null;
    desc: string | null;
    nota: string | null;
}

export interface Operacion {
    cod: string | null;
    desc: string | null;
}

export interface Intervencion {
    cod_interv: string | null;
    fecha: string | null;
    tecnico: string | null;
    notas: string | null;
    actividades: Actividad[];
    operaciones: Operacion[];
}

export interface AveriaAnterior {
    codigo: string | null;
    fecha: string | null;
    descripcion: string | null;
    actividades: Actividad[];
}

// ─── Intervenciones ────────────────────────────────────────────────────────

export function parseIntervencionesCompletas(texto: string): Intervencion[] {
    const intervencionesTexto = getIntervenciones(texto);
    return intervencionesTexto.map((iTexto) => {
        const base = parseIntervencion(iTexto);
        return {
            cod_interv: base.cod_interv,
            fecha: base.fecha,
            tecnico: base.tecnico,
            notas: base.notas,
            actividades: parseActividades(base.actividades_raw),
            operaciones: parseOperaciones(base.operaciones_raw),
        };
    });
}

function getIntervenciones(texto: string): string[] {
    if (!texto || texto === "Sin intervenciones") return [];
    return texto
        .split(/\n(?=COD_INTERV:)/)
        .map((i) => i.trim())
        .filter((i) => i.length > 0);
}

function parseIntervencion(intervencionTexto: string) {
    const getValue = (regex: RegExp) => {
        const match = intervencionTexto.match(regex);
        return match ? match[1].trim() : null;
    };
    return {
        cod_interv: getValue(/COD_INTERV:([^|]+)/),
        fecha: getValue(/FECHA:([^|]+)/),
        tecnico: getValue(/TECNICO:([^|]+)/),
        notas: getValue(/NOTAS:([^|]+)/),
        actividades_raw: getValue(/ACTIVIDADES:\((.*?)\)\s*\|/),
        operaciones_raw: getValue(/OPERACIONES:\((.*?)\)$/),
    };
}

function parseActividades(actividadesRaw: string | null): Actividad[] {
    if (!actividadesRaw) return [];
    const regex = /\[COD:(.*?)\| DESC:(.*?)\| NOTA:(.*?)\]/g;
    const actividades: Actividad[] = [];
    let match;
    while ((match = regex.exec(actividadesRaw)) !== null) {
        actividades.push({
            cod: match[1].trim() || null,
            desc: match[2].trim() || null,
            nota: match[3].trim() || null,
        });
    }
    return actividades;
}

function parseOperaciones(operacionesRaw: string | null): Operacion[] {
    if (!operacionesRaw) return [];
    const regex = /\[COD:(.*?)\| DESC:(.*?)\]/g;
    const operaciones: Operacion[] = [];
    let match;
    while ((match = regex.exec(operacionesRaw)) !== null) {
        operaciones.push({ cod: match[1].trim() || null, desc: match[2].trim() || null });
    }
    return operaciones;
}

// ─── Avería Anterior ──────────────────────────────────────────────────────

export function parseAveriaAnteriorCompleta(texto: string): AveriaAnterior | null {
    const base = parseAveriaAnterior(texto);
    if (!base) return null;
    return {
        codigo: base.codigo,
        fecha: base.fecha,
        descripcion: base.descripcion,
        actividades: parseActividades(base.actividades_raw),
    };
}

function parseAveriaAnterior(texto: string) {
    if (!texto || texto === "Sin averia anterior") return null;
    const getValue = (regex: RegExp) => {
        const match = texto.match(regex);
        return match ? match[1].trim() : null;
    };
    return {
        codigo: getValue(/CODIGO:([^|]+)/),
        fecha: getValue(/FECHA:([^|]+)/),
        descripcion: getValue(/DESCRIPCION:([^|]+)/),
        actividades_raw: getValue(/ACTIVIDADES:\((.*)\)$/),
    };
}  