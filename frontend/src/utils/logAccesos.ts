import axios from 'axios';

export type RegionCode = 'C' | 'B';

const LAST_REGION_KEY = 'stv_last_region';

export function setLastRegion(code: RegionCode | null) {
    if (!code) return;
    try {
        localStorage.setItem(LAST_REGION_KEY, code);
    } catch { 
        // LocalStorage might be disabled
    }
}

export function getLastRegion(): RegionCode | null {
    try {
        const val = localStorage.getItem(LAST_REGION_KEY);
        return val === 'C' || val === 'B' ? val : null;
    } catch {
        return null;
    }
}

export function inferRegionCodeFromSearch(search?: string): RegionCode | null {
    if (!search) return null;
    const params = new URLSearchParams(search);
    const tr = params.get('TR');
    if (tr === 'C' || tr === 'B') return tr;

    const mainplant = params.get('mainplant');
    if (mainplant) {
        if (mainplant.includes('6S')) return 'C';
        if (mainplant.includes('6E')) return 'B';
    }

    const mps = params.get('mps');
    if (mps) {
        if (mps.includes('6S')) return 'C';
        if (mps.includes('6E')) return 'B';
    }

    const f = params.get('f');
    if (f === 'C' || f === 'B') return f;

    const codAlm = params.get('codAlm');
    if (codAlm === '0100') return 'C';
    if (codAlm === '0120') return 'B';

    return null;
}

export function inferRegionCodeFromUrl(url: string): RegionCode | null {
    try {
        const u = new URL(url, window.location.origin);
        return inferRegionCodeFromSearch(u.search);
    } catch {
        return null;
    }
}

export async function logAcceso(payload: {
    vistaCode?: string;
    regionCode?: RegionCode;
    ruta?: string;
    query?: string;
}) {
    try {
        await axios.post('/log-accesos', payload, { withCredentials: true });
    } catch {
        // best-effort, silent fail
    }
}

  