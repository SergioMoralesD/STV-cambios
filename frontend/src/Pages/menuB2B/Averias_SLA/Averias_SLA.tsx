import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../Context/AuthContext";
import { useSelection } from "../../../Context/SelectionContext";
import { fetchMetricas } from "../../../services/metricasService";

import { fetchAveriasSLA, fetchSlaObjetivo } from "../../../services/averiaService";
import type { AllMetricas, AveriaSLA } from "../../../services/Types";
import AveriasSLADashboardTexto from "../../../Components/Averias_SLA/AveriasSLADashboardTexto";
import Loader from "../../../Components/common/Loader";
import useBackgroundImage from "../../../Hooks/useBackgroundImage";
import {
    obtenerColumnasAgrupadas,
    obtenerDelegacionesVista,
    obtenerRegionActual,
    resolverMainplant,
} from "../../../config/regionConfig";
import { remoteLog } from "../../../utils/logger";

export default function AveriasSLAPage() {
    const { user } = useAuth();
    const { selectedRegion, selectedDelegations } = useSelection();
    const navigate = useNavigate();

    const regionParam = useMemo(
        () => obtenerRegionActual(selectedRegion, user?.regiones),
        [selectedRegion, user?.regiones]
    );

    const allowed = useMemo(
        () => obtenerDelegacionesVista(user?.delegaciones, regionParam, "AVSLA"),
        [user?.delegaciones, regionParam]
    );

    const mainplant = useMemo(() => {
        return resolverMainplant({
            seleccion: selectedDelegations,
            permitidas: allowed,
            modo: "estricto",
        });
    }, [selectedDelegations, allowed]);

    // 4. Redirección y Logging
    useEffect(() => {
        if (mainplant === null) {
            navigate("/hub");
        }
        remoteLog(`Averias_SLA: ${mainplant}`, { level: 'INFO', context: 'Averias_SLA' });
    }, [mainplant, navigate]);

    const [metricas, setMetricas] = useState<AllMetricas | null>(null);
    const [averias, setAverias] = useState<AveriaSLA[]>([]);
    const [loading, setLoading] = useState(true);
    const lastFetchedMainplant = useRef<string | null>(null);

    useBackgroundImage('/img/Fondo_Escritorio_2.jpg', 'Averías SLA');

    const cargarDatos = useCallback(async (silent = false) => {
        if (!mainplant) return;

        // Evitar peticiones duplicadas si ya estamos cargando o si ya tenemos los datos para este mainplant
        // (Excepto si es un refresco silencioso)
        if (!silent && lastFetchedMainplant.current === mainplant) {
            return;
        }

        if (!silent) {
            setLoading(true);
        }

        try {
            const [m, a] = await Promise.all([
                fetchMetricas(mainplant),
                fetchAveriasSLA(mainplant),
            ]);
            lastFetchedMainplant.current = mainplant;
            setMetricas(m);
            setAverias(a);
        } catch (e) {
            console.error("Error SLA:", e);
        } finally {
            setLoading(false);
        }
    }, [mainplant]);

    useEffect(() => {
        cargarDatos();
        const i = setInterval(() => {
            cargarDatos(true);
        }, 60_000);

        // Log consolidado arriba en la redirección

        return () => clearInterval(i);
    }, [cargarDatos]);

    const columnas = useMemo(() => (mainplant ? obtenerColumnasAgrupadas(mainplant, user?.rol_nombre) : []), [mainplant, user?.rol_nombre]);

    if (!mainplant) return null;

    return (
        <>
            {loading && <Loader />}
            <AveriasSLADashboardTexto
                metricas={metricas}
                averias={averias}
                loading={loading}
                columnas={columnas}
            />
        </>
    );
}
  