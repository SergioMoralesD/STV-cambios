import { useEffect, useState, useMemo } from 'react';
import { fetchRepuestosCatalog, fetchInventario, type Repuesto, type Inventario } from '../../../services/aprovisionamientoService';
import RepuestosPanel, { type RepuestoItem, type LegendItem } from '../../../Components/common/RepuestosPanel';
import { useSelection } from '../../../Context/SelectionContext';
import useBackgroundImage from '../../../Hooks/useBackgroundImage';

function getColorClass(diffMeses: number): string {
    if (diffMeses >= 12) return "bg-black text-white border-white";
    if (diffMeses >= 3) return "bg-[#ff0000] text-white border-white";
    if (diffMeses >= 1) return "bg-[#ffff00] text-black border-black";
    return "bg-[#00c400] text-black border-black";
}

const LEGEND: LegendItem[] = [
    { colorClass: "bg-black border border-white", label: "Más de 1 año" },
    { colorClass: "bg-[#ff0000] border border-white", label: "De 3 a 12 meses" },
    { colorClass: "bg-[#ffff00] border border-black", label: "De 1 a 3 meses" },
    { colorClass: "bg-[#00c400] border border-black", label: "Menos de 1 mes" },
];

const formatFecha = (f: string) => (f ? f.replace("T", " ").slice(0, 16) : "Desconocida");

export default function RepuestosSinInventariar() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [catalog, setCatalog] = useState<Repuesto[]>([]);
    const [inventario, setInv] = useState<Inventario[]>([]);
    const [now] = useState(() => Date.now());

    useBackgroundImage("/img/Fondo_Escritorio_2.jpg", "Repuestos sin inventariar");

    const { selectedRegion } = useSelection();
    const codAlmacen = selectedRegion?.toLowerCase().includes("baleares") ? "102" : "101";

    useEffect(() => {
        let isMounted = true;

        const loadData = (silent = false) => {
            if (!silent) setLoading(true);
            setError(null);
            Promise.all([fetchRepuestosCatalog(), fetchInventario(codAlmacen)])
                .then(([cat, inv]) => { if (isMounted) { setCatalog(cat); setInv(inv); } })
                .catch(err => { if (isMounted) setError(err.message || 'Error de conexión.'); })
                .finally(() => { if (isMounted) setLoading(false); });
        };

        loadData();
        const interval = setInterval(() => loadData(true), 60000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [codAlmacen]);

    const items = useMemo<RepuestoItem[]>(() => {
        const repMap = new Map(catalog.map(c => [c.CODIGO_REPUESTO, c]));

        return inventario
            .map(inv => {
                const rep = repMap.get(inv.CODIGO_REPUESTO);
                const diffMeses = (now - new Date(inv.FECHA_INVENTARIO).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
                return {
                    key: inv.CODIGO_REPUESTO,
                    label: rep?.NOMBRE_REPUESTO ?? inv.CODIGO_REPUESTO,
                    colorClass: getColorClass(diffMeses),
                    imagen: rep?.IMAGEN,
                    diffMeses,
                    fechaInv: inv.FECHA_INVENTARIO,
                    tooltip: (
                        <>
                            <span className="font-bold text-lg mb-1">{inv.CODIGO_REPUESTO}</span>
                            <span className="mb-0.5">
                                <span className="font-bold text-[#0052a5]">Nombre: </span>
                                {rep?.NOMBRE_REPUESTO ?? '—'}
                            </span>
                            <span className="mb-0.5">
                                <span className="font-bold text-[#0052a5]">Últ. inventario: </span>
                                {formatFecha(inv.FECHA_INVENTARIO)}
                            </span>
                            <span className="mb-0.5">
                                <span className="font-bold text-[#0052a5]">Meses sin inventariar: </span>
                                {diffMeses.toFixed(1)}
                            </span>
                        </>
                    ),
                } satisfies RepuestoItem & { diffMeses: number; fechaInv: string };
            })
            .sort((a, b) => b.diffMeses - a.diffMeses);
    }, [catalog, inventario, now]);

    const titleText = codAlmacen === "102" ? "102 - Baleares" : "101 - Canarias";

    return (
        <RepuestosPanel
            title={<>Repuestos con más tiempo sin inventariar: <br /> {titleText}</>}
            legend={LEGEND}
            items={items}
            loading={loading}
            error={error}
            onDismissError={() => setError(null)}
            emptyMessage="No hay datos de inventario para este almacén."
        />
    );
}
  