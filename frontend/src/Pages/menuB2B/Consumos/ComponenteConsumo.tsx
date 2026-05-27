import { useState, useEffect, useMemo } from "react";
import { fetchConsumoAlmacen, type ConsumoAlmacenItem } from "../../../services/consumoService";
import "./ComponenteConsumo.css";
import { remoteLog } from "../../../utils/logger";
import Loader from "../../../Components/common/Loader";

interface ComponenteConsumoProps {
    codAlm: string; // "101" = Canarias, "102" = Baleares
    mps: string;    // Delegaciones seleccionadas (ej. "6S21-6S23")
}

const DELEG_MAP: Record<string, string> = {
    "6S21": "tenerife repuestos",
    "6S23": "gran canaria",
    "6S24": "lanzarote",
    "6S25": "fuerteventura",
    "6E21": "mallorca",
    "6E22": "ibiza",
    "6E23": "menorca",
    "6E41": "formentera",
};

export default function ComponenteConsumo({ codAlm, mps }: ComponenteConsumoProps) {
    const [data, setData] = useState<ConsumoAlmacenItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    // Filtros
    const [fechaIni, setFechaIni] = useState<string>("");
    const [fechaFin, setFechaFin] = useState<string>("");
    const [filtroMps, setFiltroMps] = useState<string>("Todas");
    const [searchTerm, setSearchTerm] = useState<string>("");

    // Mapa de islas según región
    const mapIslas = useMemo(() => {
        if (codAlm === "102") {
            return {
                mallorca: "Mallorca",
                ibiza: "Ibiza",
                menorca: "Menorca",
                formentera: "Formentera",
            };
        }
        return {
            "tenerife repuestos": "Tenerife",
            "gran canaria": "Gran Canaria",
            lanzarote: "Lanzarote",
            fuerteventura: "Fuerteventura",
        };
    }, [codAlm]);

    // Sincronizar selección global
    useEffect(() => {
        const codes = mps.split("-").filter(Boolean);
        if (codes.length === 1) {
            const destinatario = DELEG_MAP[codes[0]];
            if (destinatario) {
                setFiltroMps(destinatario);
            } else {
                setFiltroMps("Todas");
            }
        } else {
            setFiltroMps("Todas");
        }
        remoteLog(`ComponenteConsumo: ${codAlm}`, { level: 'INFO', context: 'ComponenteConsumo' });
    }, [mps]);

    // Función de carga centralizada
    const loadData = async (almacen: string, ini: string, fin: string, silent = false) => {
        if (!silent) setLoading(true);
        if (!silent) setError("");
        try {
            const res = await fetchConsumoAlmacen(almacen, ini, fin);
            setData(res);
        } catch (e) {
            console.error(e);
            if (!silent) setError("Hubo un error al ejecutar la solicitud a la API. Recargue la página.");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // Carga inicial
    useEffect(() => {
        const hoy = new Date();
        const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

        const fIni = formatearFechaInput(primerDia);
        const fFin = formatearFechaInput(ultimoDia);

        setFechaIni(fIni);
        setFechaFin(fFin);
        setFiltroMps("Todas");
        setSearchTerm("");

        loadData(
            codAlm,
            formatearParaApi(primerDia),
            formatearParaApi(
                new Date(ultimoDia.getFullYear(), ultimoDia.getMonth(), ultimoDia.getDate(), 23, 59, 59)
            )
        );
        remoteLog(`ComponenteConsumo: ${codAlm}`, { level: 'INFO', context: 'ComponenteConsumo' });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [codAlm]);

    useEffect(() => {
        if (!fechaIni || !fechaFin) return;
        const interval = setInterval(() => {
            const dIni = new Date(fechaIni);
            const dFin = new Date(fechaFin);
            dFin.setHours(23, 59, 59);
            if (dFin >= dIni) {
                loadData(codAlm, formatearParaApi(dIni), formatearParaApi(dFin), true);
            }
        }, 60000);
        remoteLog(`ComponenteConsumo: ${codAlm}`, { level: 'INFO', context: 'ComponenteConsumo' });
        return () => clearInterval(interval);
    }, [codAlm, fechaIni, fechaFin]);

    const handleDateChange = () => {
        if (!fechaIni || !fechaFin) return;
        const dIni = new Date(fechaIni);
        const dFin = new Date(fechaFin);
        dFin.setHours(23, 59, 59);
        if (dFin < dIni) return;
        loadData(codAlm, formatearParaApi(dIni), formatearParaApi(dFin));
    };

    const filteredData = useMemo(() => {
        return data.filter((item) => {
            const destinatario = item.DESTINATARIO?.toLowerCase() || "";
            if (filtroMps !== "Todas" && destinatario !== filtroMps) return false;
            if (searchTerm) {
                const searchLow = searchTerm.toLowerCase();
                const codRep = item.CODIGO_REPUESTO?.toLowerCase() || "";
                const nomRep = item.NOMBRE_REPUESTO?.toLowerCase() || "";
                if (!codRep.includes(searchLow) && !nomRep.includes(searchLow)) return false;
            }
            return true;
        });
    }, [data, filtroMps, searchTerm]);

    const totalsByIsland = useMemo(() => {
        const totals: Record<string, number> = {};
        for (const key of Object.keys(mapIslas)) totals[key] = 0;
        let grandTotal = 0;

        filteredData.forEach((row) => {
            const is = row.DESTINATARIO?.toLowerCase() || "";
            let price = row.COSTE_TOTAL;
            if (typeof price === "string") {
                price = parseFloat((price as string).replace(",", ".")) || 0;
            }
            if (totals[is] !== undefined) totals[is] += price as number;
            grandTotal += price as number;
        });

        return { totals, grandTotal };
    }, [filteredData, mapIslas]);

    const excelClick = () => {
        const generateExcel = () => {
            try {
                const table = document.getElementById("consumo-table-id");
                if (!table) return;
                const XLSX = (window as any).XLSX;
                const ws = XLSX.utils.table_to_sheet(table);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Datos");
                XLSX.writeFile(wb, "ConsumoAlmacen.xlsx");
            } catch (e) {
                console.error("Error generating excel", e);
                alert("Error al generar Excel.");
            }
        };

        if ((window as any).XLSX) {
            generateExcel();
        } else {
            const script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
            script.onload = () => generateExcel();
            script.onerror = () => alert("Fallo al descargar la librería de Excel");
            document.body.appendChild(script);
        }
    };

    return (
    <div className="consumo-module-wrapper">
            <header className="header">
                <div className="container">
                    <div className="header__wrapper">

                        <div className="header__title">
                            <h1>Consumo almacén</h1>
                        </div>

                        <div className="header__nav">
                            <div className="header__excel">
                                <a className="header__buttons--item item__excel" onClick={excelClick}>
                                    Generar Excel
                                </a>
                            </div>

                            <div className="header__buttons">
                                <form className="header__form">
                                    <select
                                        className="header__buttons--item"
                                        value={filtroMps}
                                        onChange={(e) => setFiltroMps(e.target.value)}
                                    >
                                        <option value="Todas">Todas</option>
                                        {Object.keys(mapIslas).map((clave) => (
                                            <option key={clave} value={clave}>
                                                {(mapIslas as any)[clave]}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="date"
                                        className="header__buttons--item item__fecha"
                                        value={fechaIni}
                                        onChange={(e) => setFechaIni(e.target.value)}
                                        onBlur={handleDateChange}
                                    />
                                    <input
                                        type="date"
                                        className="header__buttons--item item__fecha"
                                        value={fechaFin}
                                        min={fechaIni}
                                        onChange={(e) => setFechaFin(e.target.value)}
                                        onBlur={handleDateChange}
                                    />
                                </form>

                                <div className="header__search">
                                    <input
                                        type="text"
                                        className="header__search-input"
                                        placeholder="Código de repuesto o nombre:"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main id="main">
                <section className="main">
                    <div className="container">
                        {error && (
                            <div className="error-container">
                                <span>{error}</span>
                                <div className="cruzError" onClick={() => setError("")}>X</div>
                            </div>
                        )}

                        {loading && !error && <Loader />}

                        {!error && (
                            <div className="main__background">
                                <div className="main__wrapper">
                                    <div className="main__table">
                                        <table className="table" id="consumo-table-id">
                                            <thead className="table__head">
                                                <tr>
                                                    <th>FECHA MOVIMIENTO</th>
                                                    <th>CÓDIGO REPUESTO</th>
                                                    <th>NOMBRE REPUESTO</th>
                                                    <th>PRECIO UNIDAD</th>
                                                    <th>CANTIDAD</th>
                                                    <th>PRECIO TOTAL</th>
                                                    <th>DESTINATARIO</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredData.map((item, index) => {
                                                    const pEstandar = parseFloat(
                                                        item.PRECIO_ESTANDAR?.toString().replace(",", ".") || "0"
                                                    ).toFixed(2);
                                                    const pTotal = parseFloat(
                                                        item.COSTE_TOTAL?.toString().replace(",", ".") || "0"
                                                    ).toFixed(2);

                                                    return (
                                                        <tr key={index}>
                                                            <td>{item.FECHA_MOVIMIENTO?.replace("T", " ") || ""}</td>
                                                            <td>{item.CODIGO_REPUESTO}</td>
                                                            <td>{item.NOMBRE_REPUESTO}</td>
                                                            <td className="price-cell">{pEstandar}€</td>
                                                            <td>{item.CANTIDAD_MOV}</td>
                                                            <td className="price-cell">{pTotal}€</td>
                                                            <td style={{ textTransform: "capitalize" }}>
                                                                {item.DESTINATARIO?.toLowerCase()}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {!error && (
                    <section className="cubes">
                        <div className="container">
                            <div className="cubes__wrapper">
                                <div className="cubes__four">
                                    {Object.keys(mapIslas).map((islaKey) => (
                                        <div className="cubes__item" key={islaKey}>
                                            <div className="cubes__image">
                                                <svg viewBox="0 0 1000 1000" width="60" height="60">
                                                    <path
                                                        fill="#00b2ca"
                                                        d="M597.8 352.9c0-147.59999999999997-120.09999999999997-267.7-267.69999999999993-267.7s-267.6 120.10000000000002-267.6 267.7 120.1 267.6 267.7 267.6 267.59999999999997-120 267.59999999999997-267.6z m-458.79999999999995 0c0-105.39999999999998 85.80000000000001-191.2 191.2-191.2s191.09999999999997 85.80000000000001 191.09999999999997 191.2c0 105.40000000000003-85.79999999999995 191.10000000000002-191.09999999999997 191.10000000000002s-191.2-85.69999999999999-191.2-191.10000000000002z m202.3 145.8v-21.5c51.80000000000001-3.099999999999966 86.59999999999997-26.899999999999977 86.59999999999997-73.39999999999998 0-53.5-40.599999999999966-67-86.59999999999997-76.80000000000001v-66.10000000000002c38.599999999999966 0.7000000000000455 38.19999999999999 38 60.80000000000001 38 11.799999999999955 0 22-8 22-21.599999999999966 0-34.10000000000002-55.700000000000045-51-82.80000000000001-51.80000000000001v-18.5c0-5.900000000000006-4.5-11.800000000000011-10.5-11.800000000000011-5.900000000000034 0-10.300000000000011 5.900000000000006-10.300000000000011 11.800000000000011v18.5c-43.39999999999998 1.4000000000000057-82.80000000000001 25.80000000000001-82.80000000000001 73.10000000000002 0 38.599999999999966 31.100000000000023 61.19999999999999 82.80000000000001 70.5v72.69999999999999c-57.80000000000001-2.400000000000034-27.600000000000023-50.400000000000034-66.5-50.400000000000034-13.099999999999994 0-21.5 8-21.5 21.900000000000034 0 27.599999999999966 29.100000000000023 62.599999999999966 88 64v21.5c0 5.899999999999977 4.5 11.899999999999977 10.300000000000011 11.899999999999977 5.899999999999977 0 10.5-6 10.5-12z m0-125.80000000000001c18.80000000000001 4.2000000000000455 42.80000000000001 11.100000000000023 42.80000000000001 34.80000000000001 0 22.900000000000034-22 32.69999999999999-42.80000000000001 34v-68.80000000000001z m-20.900000000000034-49.599999999999966c-26.19999999999999-5.199999999999989-39-15.300000000000011-39-32.80000000000001 0-15 15.300000000000011-28.899999999999977 39-29.600000000000023v62.400000000000034z m562.5 69.19999999999999h-239.19999999999993c-5.100000000000023 38.89999999999998-17.200000000000045 75.69999999999999-35.80000000000007 108.89999999999998h275c30.399999999999977 0 54.60000000000002-24.19999999999999 54.60000000000002-54.599999999999966 0-30-24.200000000000045-54.30000000000001-54.60000000000002-54.30000000000001z m0 137.70000000000005h-292.29999999999995c-32.5 47-77.60000000000002 85-130.3 108.89999999999998h422.49999999999994c30.40000000000009 0 54.60000000000002-24.200000000000045 54.60000000000002-54.60000000000002 0.10000000000002274-30.100000000000023-24.100000000000023-54.299999999999955-54.5-54.299999999999955z m0-275.40000000000003h-250.39999999999998c9.299999999999955 29.69999999999999 14.399999999999977 61.69999999999999 14.399999999999977 94.59999999999997 0 5.100000000000023 0 9.900000000000034-0.39999999999997726 14.700000000000045h236.29999999999995c30.40000000000009 0 54.60000000000002-24.600000000000023 54.60000000000002-54.60000000000002 0.10000000000002274-30.399999999999977-24.100000000000023-54.69999999999999-54.5-54.69999999999999z m0 412.7h-570.0999999999999c-30.40000000000009 0-54.60000000000008 24.600000000000023-54.60000000000008 54.60000000000002 0 30.399999999999977 24.19999999999999 54.60000000000002 54.60000000000002 54.60000000000002h570.0999999999999c30.40000000000009 0 54.600000000000136-24.200000000000045 54.600000000000136-54.60000000000002 0-30-24.200000000000045-54.60000000000002-54.60000000000002-54.60000000000002z m0 137.70000000000005h-570.0999999999999c-30.40000000000009 0-54.60000000000008 24.59999999999991-54.60000000000008 54.59999999999991 0 30.40000000000009 24.19999999999999 54.60000000000002 54.60000000000002 54.60000000000002h570.0999999999999c30.40000000000009 0 54.600000000000136-24.199999999999932 54.600000000000136-54.60000000000002 0-30-24.200000000000045-54.59999999999991-54.60000000000002-54.59999999999991z m0-578.8000000000001c30.399999999999977 2.842170943040401e-14 54.60000000000002-24.599999999999966 54.60000000000002-54.599999999999966s-24.200000000000045-54.60000000000001-54.60000000000002-54.60000000000001h-337c32.5 30.39999999999999 58.80000000000007 67.7 76.30000000000007 109.2h260.69999999999993z"
                                                    />
                                                </svg>
                                            </div>
                                            <div className="cubes__info">
                                                <p>{(mapIslas as any)[islaKey]}</p>
                                                <h6>{totalsByIsland.totals[islaKey].toFixed(2)}€</h6>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="cubes__total">
                                    <div className="bigCube">
                                        <div className="cubes__image">
                                            <svg viewBox="0 0 1000 1000" width="120" height="120">
                                                <path
                                                    fill="#00b2ca"
                                                    d="M597.8 352.9c0-147.59999999999997-120.09999999999997-267.7-267.69999999999993-267.7s-267.6 120.10000000000002-267.6 267.7 120.1 267.6 267.7 267.6 267.59999999999997-120 267.59999999999997-267.6z m-458.79999999999995 0c0-105.39999999999998 85.80000000000001-191.2 191.2-191.2s191.09999999999997 85.80000000000001 191.09999999999997 191.2c0 105.40000000000003-85.79999999999995 191.10000000000002-191.09999999999997 191.10000000000002s-191.2-85.69999999999999-191.2-191.10000000000002z m202.3 145.8v-21.5c51.80000000000001-3.099999999999966 86.59999999999997-26.899999999999977 86.59999999999997-73.39999999999998 0-53.5-40.599999999999966-67-86.59999999999997-76.80000000000001v-66.10000000000002c38.599999999999966 0.7000000000000455 38.19999999999999 38 60.80000000000001 38 11.799999999999955 0 22-8 22-21.599999999999966 0-34.10000000000002-55.700000000000045-51-82.80000000000001-51.80000000000001v-18.5c0-5.900000000000006-4.5-11.800000000000011-10.5-11.800000000000011-5.900000000000034 0-10.300000000000011 5.900000000000006-10.300000000000011 11.800000000000011v18.5c-43.39999999999998 1.4000000000000057-82.80000000000001 25.80000000000001-82.80000000000001 73.10000000000002 0 38.599999999999966 31.100000000000023 61.19999999999999 82.80000000000001 70.5v72.69999999999999c-57.80000000000001-2.400000000000034-27.600000000000023-50.400000000000034-66.5-50.400000000000034-13.099999999999994 0-21.5 8-21.5 21.900000000000034 0 27.599999999999966 29.100000000000023 62.599999999999966 88 64v21.5c0 5.899999999999977 4.5 11.899999999999977 10.300000000000011 11.899999999999977 5.899999999999977 0 10.5-6 10.5-12z m0-125.80000000000001c18.80000000000001 4.2000000000000455 42.80000000000001 11.100000000000023 42.80000000000001 34.80000000000001 0 22.900000000000034-22 32.69999999999999-42.80000000000001 34v-68.80000000000001z m-20.900000000000034-49.599999999999966c-26.19999999999999-5.199999999999989-39-15.300000000000011-39-32.80000000000001 0-15 15.300000000000011-28.899999999999977 39-29.600000000000023v62.400000000000034z m562.5 69.19999999999999h-239.19999999999993c-5.100000000000023 38.89999999999998-17.200000000000045 75.69999999999999-35.80000000000007 108.89999999999998h275c30.399999999999977 0 54.60000000000002-24.19999999999999 54.60000000000002-54.599999999999966 0-30-24.200000000000045-54.30000000000001-54.60000000000002-54.30000000000001z m0 137.70000000000005h-292.29999999999995c-32.5 47-77.60000000000002 85-130.3 108.89999999999998h422.49999999999994c30.40000000000009 0 54.60000000000002-24.200000000000045 54.60000000000002-54.60000000000002 0.10000000000002274-30.100000000000023-24.100000000000023-54.299999999999955-54.5-54.299999999999955z m0-275.40000000000003h-250.39999999999998c9.299999999999955 29.69999999999999 14.399999999999977 61.69999999999999 14.399999999999977 94.59999999999997 0 5.100000000000023 0 9.900000000000034-0.39999999999997726 14.700000000000045h236.29999999999995c30.40000000000009 0 54.60000000000002-24.600000000000023 54.60000000000002-54.60000000000002 0.10000000000002274-30.399999999999977-24.100000000000023-54.69999999999999-54.5-54.69999999999999z m0 412.7h-570.0999999999999c-30.40000000000009 0-54.60000000000008 24.600000000000023-54.60000000000008 54.60000000000002 0 30.399999999999977 24.19999999999999 54.60000000000002 54.60000000000002 54.60000000000002h570.0999999999999c30.40000000000009 0 54.600000000000136-24.200000000000045 54.600000000000136-54.60000000000002 0-30-24.200000000000045-54.60000000000002-54.60000000000002-54.60000000000002z m0 137.70000000000005h-570.0999999999999c-30.40000000000009 0-54.60000000000008 24.59999999999991-54.60000000000008 54.59999999999991 0 30.40000000000009 24.19999999999999 54.60000000000002 54.60000000000002 54.60000000000002h570.0999999999999c30.40000000000009 0 54.600000000000136-24.199999999999932 54.600000000000136-54.60000000000002 0-30-24.200000000000045-54.59999999999991-54.60000000000002-54.59999999999991z m0-578.8000000000001c30.399999999999977 2.842170943040401e-14 54.60000000000002-24.599999999999966 54.60000000000002-54.599999999999966s-24.200000000000045-54.60000000000001-54.60000000000002-54.60000000000001h-337c32.5 30.39999999999999 58.80000000000007 67.7 76.30000000000007 109.2h260.69999999999993z"
                                                />
                                            </svg>
                                        </div>
                                        <div className="cubes__info">
                                            <p>Total</p>
                                            <h6>{totalsByIsland.grandTotal.toFixed(2)}€</h6>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}

// ── Utilidades de fecha ────────────────────────────────────────────────────

function formatearFechaInput(fecha: Date): string {
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, "0");
    const dd = String(fecha.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function formatearParaApi(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, "0");
    const day = String(fecha.getDate()).padStart(2, "0");
    const hours = String(fecha.getHours() || 0).padStart(2, "0");
    const minutes = String(fecha.getMinutes() || 0).padStart(2, "0");
    const seconds = String(fecha.getSeconds() || 0).padStart(2, "0");
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}
  