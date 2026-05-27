import { useEffect, useState, useMemo } from 'react';
import { fetchRepuestosCatalog, fetchExistencias, type Repuesto, type Existencia } from '../../../services/aprovisionamientoService';
import RepuestosPanel, { type RepuestoItem, type LegendItem } from '../../../Components/common/RepuestosPanel';
import { useSelection } from '../../../Context/SelectionContext';
import useBackgroundImage from '../../../Hooks/useBackgroundImage';
import { remoteLog } from '../../../utils/logger';

interface MergedRepuesto extends Repuesto, Existencia { }

function getColorClass(repuesto: MergedRepuesto): string {
    const min = repuesto.STOCK_MINIMO ?? 0;
    const max = repuesto.STOCK_MAXIMO ?? 0;
    const curr = repuesto.CANTIDAD_ACTUAL ?? 0;

    if (min === 0 || max === 0) return "bg-[#800080] text-white border-white";      // sin parametrizar
    if (curr <= 0) return "bg-white text-black border-black";           // sin stock
    if (curr >= max * 1.2) return "bg-[#00c400] text-black border-green-800";  // exceso
    if (curr >= max) return "bg-[#ffff00] text-black border-yellow-300"; // ok
    if (curr >= min) return "bg-[#ff0000] text-white border-red-800";    // peligro
    return "bg-black text-white border-gray-600";                                    // rotura
}

function orderWeight(r: MergedRepuesto): number {
    const min = r.STOCK_MINIMO ?? 0;
    const max = r.STOCK_MAXIMO ?? 0;
    const curr = r.CANTIDAD_ACTUAL ?? 0;
    if (min === 0 || max === 0) return 5;
    if (curr <= 0) return 6;
    if (curr >= max * 1.2) return 4;
    if (curr >= max) return 3;
    if (curr >= min) return 2;
    return 1;
}

const LEGEND: LegendItem[] = [
    { colorClass: "bg-white border border-black", label: "Sin Stock (≤0)" },
    { colorClass: "bg-black border border-white", label: "Rotura (<Mín)" },
    { colorClass: "bg-[#ff0000] border border-white", label: "Peligro (Mín..Máx)" },
    { colorClass: "bg-[#ffff00] border border-black", label: "Ok (Máx..Máx+20%)" },
    { colorClass: "bg-[#00c400] border border-black", label: "Exceso (≥Máx+20%)" },
];

export default function AprovisionamientoRepuestos() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [catalog, setCatalog] = useState<Repuesto[]>([]);
    const [existencias, setExist] = useState<Existencia[]>([]);

    useBackgroundImage("/img/Fondo_Escritorio_2.jpg", "Aprovisionamiento de Repuestos");

    const { selectedRegion } = useSelection();
    const codAlmacen = selectedRegion?.toLowerCase().includes("baleares") ? "102" : "101";

    useEffect(() => {
        let isMounted = true;
        let interval: ReturnType<typeof setInterval>;

        const loadData = (silent = false) => {
            if (!silent) setLoading(true);
            setError(null);
            Promise.all([fetchRepuestosCatalog(), fetchExistencias(codAlmacen)])
                .then(([cat, exis]) => { if (isMounted) { setCatalog(cat); setExist(exis); } })
                .catch(err => { if (isMounted) setError(err.message || 'Error de conexión.'); })
                .finally(() => { if (isMounted) setLoading(false); });
        };
        remoteLog(`AprovisionamientoRepuestos: ${codAlmacen}`, { level: 'INFO', context: 'AprovisionamientoRepuestos' });

        loadData();
        interval = setInterval(() => loadData(true), 60000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [codAlmacen]);

    const items = useMemo<RepuestoItem[]>(() => {
        const existMap = new Map(existencias.map(e => [e.CODIGO_REPUESTO, e]));

        return catalog
            .map(c => {
                const ext = existMap.get(c.CODIGO_REPUESTO);
                const merged: MergedRepuesto = {
                    ...c,
                    CANTIDAD_ACTUAL: ext?.CANTIDAD_ACTUAL ?? 0,
                    STOCK_MINIMO: ext?.STOCK_MINIMO ?? 0,
                    STOCK_MAXIMO: ext?.STOCK_MAXIMO ?? 0,
                    PRIORIDAD: ext?.PRIORIDAD ?? 'B',
                };
                return {
                    key: merged.CODIGO_REPUESTO,
                    label: merged.NOMBRE_REPUESTO,
                    colorClass: getColorClass(merged),
                    imagen: merged.IMAGEN,
                    _weight: orderWeight(merged),
                    tooltip: (
                        <>
                            <span className="font-bold text-lg mb-1">{merged.CODIGO_REPUESTO}</span>
                            <span className="mb-0.5">
                                <span className="font-bold text-[#0052a5]">Cantidad actual: </span>
                                {merged.CANTIDAD_ACTUAL}
                            </span>
                            <span className="mb-0.5">
                                <span className="font-bold text-[#0052a5]">Stock mínimo: </span>
                                {merged.STOCK_MINIMO}
                            </span>
                            <span className="mb-0.5">
                                <span className="font-bold text-[#0052a5]">Stock máximo: </span>
                                {merged.STOCK_MAXIMO}
                            </span>
                        </>
                    ),
                } satisfies RepuestoItem & { _weight: number };
            })
            .sort((a, b) => a._weight - b._weight);
    }, [catalog, existencias]);

    const titleText = codAlmacen === "102" ? "102 - Baleares" : "101 - Canarias";

    return (
        <RepuestosPanel
            title={<>Aprovisionamiento de repuestos: <br /> {titleText}</>}
            legend={LEGEND}
            items={items}
            loading={loading}
            error={error}
            onDismissError={() => setError(null)}
            emptyMessage="No hay repuestos registrados o existencias disponibles."
        />
    );
}
  