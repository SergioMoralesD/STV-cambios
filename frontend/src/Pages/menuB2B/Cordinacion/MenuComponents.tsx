import type { VistaConfig } from "../../../config/menuConfig";
import { inferRegionCodeFromUrl, logAcceso, setLastRegion } from "../../../utils/logAccesos";
import "./cordinacion.css";
import type { Region } from "../../../config/regionConfig";
import { Role } from "../../../config/roles";

// ─── RegionSelector ────────────────────────────────────────────────────────
export function RegionSelector({ onSelect, allowedRegions }: { onSelect: (r: Region) => void, allowedRegions?: { codigo: string; nombre: string }[] }) {
    if (!allowedRegions || allowedRegions.length === 0) {
        return (
            <div className="row">
                <div className="cajaboton">
                    <p>No tienes acceso a ninguna región.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="row">
            <div className="cajaboton">
                {allowedRegions.map((tr) => (
                    <a
                        key={tr.codigo}
                        href={`/cordinacion?TR=${tr.codigo}`}
                        className="btn"
                        onClick={(e) => {
                            if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
                            e.preventDefault();
                            onSelect(tr.codigo as Region);
                        }}
                    >
                        {tr.nombre}
                    </a>
                ))}
            </div>
        </div>
    );
}

// ─── SubMenu ───────────────────────────────────────────────────────────────
interface SubMenuProps {
    islands: { label: string; mainplant: string }[];
    onBack: () => void;
    onSelect?: (mainplant: string) => void;
    vista_id?: string;
    allowedDelegaciones?: string[];
    userRole?: string;
    getIslandUrl?: (mainplant: string) => string | null;
}

export async function navigateExternal(url: string, vistaCode?: string, regionCode?: Region) {
    const resolved = new URL(url, window.location.origin).toString();
    const inferredRegion = regionCode || inferRegionCodeFromUrl(resolved) || undefined;
    if (inferredRegion) setLastRegion(inferredRegion);

    if (vistaCode && inferredRegion) {
        try {
            const u = new URL(resolved);
            await logAcceso({
                vistaCode,
                regionCode: inferredRegion,
                ruta: u.pathname || url,
                query: u.search || '',
            });
        } catch {
            // best-effort
        }
    }

    window.location.href = resolved;
}

export function SubMenu({ islands, onBack, onSelect, vista_id, allowedDelegaciones, userRole, getIslandUrl }: SubMenuProps) {
    const filteredIslands = islands.filter(island => {
        // Si no hay restricciones o el array está vacío (admin), mostrar todo
        if (!allowedDelegaciones || allowedDelegaciones.length === 0) return true;
        const islandCodes = island.mainplant.split("-");
        return islandCodes.some(code => allowedDelegaciones.includes(code));
    });

    // Agrupación dinámica para el menú según el ROL
    const processGroupedIslands = () => {
        if (!allowedDelegaciones) return filteredIslands;

        const hasTF = allowedDelegaciones.includes("6S21");
        const hasFV = allowedDelegaciones.includes("6S25");
        // Si tiene Tenerife (6S21), le damos acceso virtual a Islas Menores (6S21_MENORES) para poder agruparlas
        const hasIM = allowedDelegaciones.includes("6S21_MENORES") || hasTF;

        const isSupervisor = userRole?.toLowerCase().trim() === "supervisor";

        // 1. Limpiamos CUALQUIER agrupación previa (contiene guion) para tratar las islas por separado
        // Esto evita que "Fuerteventura - Islas Menores" (de BD) se quede pegado para el Supervisor
        let result = filteredIslands.filter(i => !i.mainplant.includes("-"));

        // Nos aseguramos de que las islas base estén presentes si el usuario tiene permiso
        if (hasFV && !result.find(i => i.mainplant === "6S25")) {
            result.push({ label: "Fuerteventura", mainplant: "6S25" });
        }
        if (hasTF && !result.find(i => i.mainplant === "6S21")) {
            result.push({ label: "Tenerife", mainplant: "6S21" });
        }
        if (hasIM && !result.find(i => i.mainplant === "6S21_MENORES")) {
            result.push({ label: "Islas Menores", mainplant: "6S21_MENORES" });
        }

        // Si es la vista de la Agenda, no agrupamos (quedan por separado Fuerteventura e Islas Menores)
        const isLogisticaAgenda = vista_id === "STVLOGAG";

        if (!isLogisticaAgenda) {
            // --- CASO SUPERVISOR: Islas Menores se juntan con TENERIFE ---
            if (isSupervisor) {
                if (hasTF && hasIM) {
                    // Quitamos las individuales para poner la agrupada
                    result = result.filter(i => i.mainplant !== "6S21" && i.mainplant !== "6S21_MENORES");
                    result.push({ label: "Tenerife - Islas Menores", mainplant: "6S21-6S21_MENORES" });
                }
            } 
            
            // --- CASO COORDINADOR / ADMIN (Defecto): Islas Menores se juntan con FUERTEVENTURA ---
            else {
                if (hasFV && hasIM) {
                    // Quitamos las individuales para poner la agrupada
                    result = result.filter(i => i.mainplant !== "6S25" && i.mainplant !== "6S21_MENORES");
                    result.push({ label: "Fuerteventura - Islas Menores", mainplant: "6S25-6S21_MENORES" });
                }
            }
        }

        // Ordenamos los resultados según el orden oficial de Canarias (TF, GC, LZ, FV)
        const ORDEN_CANARIAS = ["6S21", "6S23", "6S24", "6S25"];
        return result.sort((a, b) => {
            // Forzar Islas Menores siempre al final del todo
            if (a.mainplant === "6S21_MENORES") return 1;
            if (b.mainplant === "6S21_MENORES") return -1;

            const getOrder = (mp: string) => {
                // Usamos startsWith para evitar que 6S25-6S21_MENORES coincida con 6S21
                const baseCode = ORDEN_CANARIAS.find(code => mp.startsWith(code));
                return baseCode ? ORDEN_CANARIAS.indexOf(baseCode) : 99;
            };
            return getOrder(a.mainplant) - getOrder(b.mainplant);
        });
    };

    const displayIslands = processGroupedIslands();

    return (
        <div>
            <button className="atras" onClick={onBack}>
                <img src="/img/Back_blue.png" alt="Volver" />
            </button>
            <div className="cajaboton">
                {displayIslands.length === 0 && (
                    <p className="no-access">No tienes acceso a ninguna delegación para esta vista.</p>
                )}
                {displayIslands.map((island) => {
                    const handleClick = (e: React.MouseEvent) => {
                        if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
                        e.preventDefault();
                        onSelect?.(island.mainplant);
                    };

                    return (
                        <a
                            key={`${island.label}-${island.mainplant}`}
                            href={getIslandUrl?.(island.mainplant) || "#"}
                            className="btn"
                            onClick={handleClick}
                            data-log-vista={vista_id || undefined}
                        >
                            {island.label}
                        </a>
                    );
                })}
            </div>
        </div>
    );
}

// ─── MainMenu ──────────────────────────────────────────────────────────────
export function MainMenu({
    region,
    onBack,
    onVistaClick,
    hasUrl,
    allowedVistas,
    menuVistas,
    getVistaUrl
}: {
    region: Region;
    onBack: () => void;
    onVistaClick: (vistaCode: string) => void;
    hasUrl?: (vistaCode: string) => boolean;
    allowedVistas?: string[];
    menuVistas?: VistaConfig[];
    getVistaUrl?: (vistaCode: string) => string | null;
}) {
    const hasAccess = (vista: string) => !allowedVistas || allowedVistas.includes(vista);
    const hasLink = (vista: string) => (hasUrl ? hasUrl(vista) : true);

    const visibleVistas = (menuVistas || [])
        .filter(v => hasAccess(v.codigo) && hasLink(v.codigo) && v.codigo !== 'CONREPM');

    const rows: VistaConfig[][] = [];
    for (let i = 0; i < visibleVistas.length; i += 2) {
        rows.push(visibleVistas.slice(i, i + 2));
    }

    return (
        <div className="websContainer" data-region={region}>
            <button className="atras" onClick={onBack}>
                <img src="/img/Back_blue.png" alt="Volver" />
            </button>
            <div className="container">
                <div className="cajasRutas1">
                    {rows.length === 0 && (
                        <div className="cajaboton">
                            <p className="no-access">No tienes acceso a ninguna vista para esta región.</p>
                        </div>
                    )}
                    {rows.map((row, idx) => (
                        <div className="cajasRutas" key={`row-${idx}`}>
                            {row.map(v => {
                                // ¿Navega directamente o muestra submenu de islas?
                                const goesDirectly = !!v.mostrar_juntas;

                                const handleClick = (e: React.MouseEvent) => {
                                    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
                                    e.preventDefault();
                                    e.stopPropagation(); // Evita que el listener de MenuLayout interfiera
                                    onVistaClick(v.codigo);
                                };

                                return (
                                    <a
                                        key={v.codigo}
                                        // Solo ponemos href real si va directamente (mostrar_juntas=true)
                                        // Para vistas con submenú de islas, href="#" para evitar navegación accidental
                                        href={goesDirectly ? (getVistaUrl?.(v.codigo) || "#") : "#"}
                                        className="btn"
                                        onClick={handleClick}
                                        data-log-vista={v.codigo}
                                        data-log-region={region}
                                    >
                                        {v.nombre?.trim() || v.codigo}
                                    </a>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
  