import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../Context/AuthContext";
import { useSelection } from "../../../Context/SelectionContext";
import { remoteLog } from "../../../utils/logger";
import { esRegion, obtenerDelegacionesVista, obtenerNombreIsla } from "../../../config/regionConfig";
import { RegionSelector, MainMenu, SubMenu } from "./MenuComponents";
import Loader from "../../../Components/common/Loader";
import { buildMenuMaps, appendQueryParam } from "../../../config/menuConfig";
import "./cordinacion.css";
import { navigateExternal } from "./MenuComponents";

import { Role } from "../../../config/roles";
import { usePermissions } from "../../../Hooks/usePermissions";

export default function Cordinacion() {
    const { user, loading: authLoading } = useAuth();
    const { canAccessVista, isTecnico, isAdmin } = usePermissions();
    const { selectedRegion: region, setSelectedRegion, setSelectedDelegations } = useSelection();
    const navigate = useNavigate();

    const [view, setView] = useState<"region" | "mainMenu" | "islas">(() => {
        return region ? "mainMenu" : "region";
    });

    const [hasAutoNavigated, setHasAutoNavigated] = useState(false);
    const autoNavParam = useMemo(() => new URLSearchParams(window.location.search).get('auto') === '1', []);
    const [activeVista, setActiveVista] = useState<string | null>(null);

    const menuMaps = useMemo(() => {
        if (!user?.menuConfig) return null;
        return buildMenuMaps(user.menuConfig);
    }, [user?.menuConfig]);

    const [tecnicoInfo, setTecnicoInfo] = useState<any>(null);

    const regionCode = useMemo(() => {
        if (isTecnico && tecnicoInfo?.CODIGO_AREA) {
            return tecnicoInfo.CODIGO_AREA.startsWith('6S') ? 'C' : 'B';
        }
        return esRegion(region) ? region : null;
    }, [isTecnico, tecnicoInfo, region]);

    const filteredVistas = useMemo(() => {
        return user?.vistas[regionCode || ''] || [];
    }, [user?.vistas, regionCode]);



    function buildVistaUrl(vistaCode: string, mainplant?: string): string | null {
        if (!regionCode) return null;

        if (!menuMaps) return null;
        
        const vistaCfg = menuMaps.vistaByCode[vistaCode];
        const key = `${regionCode}|${vistaCode}`;
        const baseUrl = menuMaps.urlByRegionVista[key];

        if (!vistaCfg || !baseUrl) return null;

        const joiner = vistaCfg.joiner || "-";
        const allowed = obtenerDelegacionesVista(user?.delegaciones, regionCode, vistaCode);
        const value = mainplant || allowed.join(joiner);

        if (!value && allowed.length === 0 && !vistaCfg.mostrar_juntas) {
            return null;
        }

        const paramKey = vistaCfg.param_key || "mainplant";
        let urlWithParams = baseUrl;
        if (value) {
            urlWithParams = appendQueryParam(baseUrl, paramKey, value);
        }
        return appendQueryParam(urlWithParams, "f", regionCode);
    }

    function navigateToVista(vistaCode: string, mainplant?: string) {
        try {
            const url = buildVistaUrl(vistaCode, mainplant);

            if (!url) {
                alert(`No se pudo construir la URL para: ${vistaCode}. Revisa la consola.`);
                return;
            }

            // Actualizar contexto para la pestaña actual
            const vistaCfg = menuMaps!.vistaByCode[vistaCode];
            const joiner = vistaCfg.joiner || "-";
            const allowed = obtenerDelegacionesVista(user?.delegaciones, regionCode!, vistaCode);
            const value = mainplant || (isTecnico && tecnicoInfo?.CODIGO_AREA) || allowed.join(joiner);
            setSelectedDelegations(value);

            if (url.startsWith("http")) {
                navigateExternal(url, vistaCode, regionCode as any);
                return;
            }

            const safePath = url.startsWith("/") ? url : `/${url}`;
            navigate(safePath);

        } catch (err) {
            remoteLog(`Critical Error en navigateToVista: ${err}`, { level: 'ERROR', context: 'Cordinacion' });
            alert("Error crítico al intentar navegar. Contacte con soporte.");
        }
    }

    function handleVistaClick(vistaCode: string) {
        if (!regionCode) return;

        if (!menuMaps) return;

        const vistaCfg = menuMaps.vistaByCode[vistaCode];
        if (!vistaCfg) {
            remoteLog(`Error: No se encontró configuración para la vista ${vistaCode}`, { level: 'ERROR', context: 'Cordinacion' });
            return;
        }

        // Caso especial: Islas
        if (!vistaCfg.mostrar_juntas) {
            const allowed = obtenerDelegacionesVista(user?.delegaciones, regionCode, vistaCode);

            if (allowed.length === 1) {
                navigateToVista(vistaCode, allowed[0]);
                return;
            }
            if (allowed.length === 0) {
                alert("No tienes delegaciones asignadas para esta sección.");
                return;
            }
            setActiveVista(vistaCode);
            setView("islas");
            return;
        }

        navigateToVista(vistaCode);
    }

    function hasVistaUrl(vistaCode: string): boolean {
        if (!regionCode) return false;
        if (!menuMaps) return false;
        return Boolean(menuMaps.urlByRegionVista[`${regionCode}|${vistaCode}`]);
    }

    // --- EFFECTS ---

    // Cargar info del técnico si es necesario para determinar la región
    useEffect(() => {
        if (isTecnico && user?.codigo_usuario && !tecnicoInfo) {
            import("../../../services/tecnicoService").then(m => m.fetchTecnicoInfo(user.codigo_usuario!))
                .then(info => {
                    setTecnicoInfo(info);
                    if (info?.CODIGO_AREA) {
                        setSelectedRegion(info.CODIGO_AREA.startsWith('6S') ? 'C' : 'B');
                    }
                });
        }
        remoteLog(`Cordinacion: ${user?.codigo_usuario}`, { level: 'INFO', context: 'Cordinacion' });
    }, [isTecnico, user?.codigo_usuario, tecnicoInfo, setSelectedRegion]);

    // Sincronizar estado con la URL
    useEffect(() => {
        remoteLog(`Cordinacion Sync: ${user?.codigo_usuario}`, { level: 'INFO', context: 'Cordinacion' });
    }, [user, authLoading, region]);


    if (authLoading) return <Loader />;
    if (isTecnico && !tecnicoInfo) return <Loader />;

    const renderContent = () => {
        if (!regionCode || view === "region") {
            return (
                <RegionSelector
                    onSelect={(r) => {
                        setSelectedRegion(r);
                        setView("mainMenu");
                    }}
                    allowedRegions={user?.regiones}
                />
            );
        }

        switch (view) {
            case "mainMenu":
                return (
                    <MainMenu
                        region={regionCode}
                        onBack={() => navigate("/hub")}
                        onVistaClick={handleVistaClick}
                        hasUrl={hasVistaUrl}
                        allowedVistas={user?.vistas?.[regionCode] || []}
                        menuVistas={user?.menuConfig?.vistas || []}
                        getVistaUrl={(v) => buildVistaUrl(v)}
                    />
                );
            case "islas": {
                if (!menuMaps || !activeVista) return null;
                const dbIslands = menuMaps.islandsByRegionVista[`${regionCode}|${activeVista}`] || [];
                const allowedDeleg = obtenerDelegacionesVista(user?.delegaciones, regionCode, activeVista);

                // Fallback: si la BD no tiene islas configuradas para esta vista,
                // generamos los botones desde las delegaciones permitidas del usuario
                const islands = dbIslands.length > 0
                    ? dbIslands
                    : allowedDeleg.map(mp => ({ label: obtenerNombreIsla(mp), mainplant: mp }));

                return (
                    <SubMenu
                        islands={islands.map(i => ({ label: i.label, mainplant: i.mainplant }))}
                        onBack={() => { setView("mainMenu"); setActiveVista(null); }}
                        onSelect={(mainplant) => navigateToVista(activeVista, mainplant)}
                        vista_id={activeVista}
                        allowedDelegaciones={allowedDeleg}
                        userRole={user?.rol_nombre}
                        getIslandUrl={(m) => buildVistaUrl(activeVista, m)}
                    />
                );
            }
            default:
                return (
                    <RegionSelector
                        onSelect={(r) => {
                            setSelectedRegion(r);
                            setView("mainMenu");
                        }}
                        allowedRegions={user?.regiones}
                    />
                );
        }
    };

    return (
        <div className="min-vh-100">
            <main className="container">{renderContent()}</main>
        </div>
    );
}
  