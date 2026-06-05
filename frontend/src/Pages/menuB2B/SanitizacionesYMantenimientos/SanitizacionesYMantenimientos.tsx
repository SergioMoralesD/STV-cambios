import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../Context/AuthContext";
import { useSelection } from "../../../Context/SelectionContext";
import {
    type Sanitizacion,
    type AvisoLimpieza,
} from "../../../services/Types";
import SanitizacionesView from "../../../Components/SanitizacionesYMantenimientos/SanitizacionesView";
import { fetchDailyMaintenance } from "../../../services/averiaService";
import { getColumnas } from "../../../services/helpers";
import useBackgroundImage from "../../../Hooks/useBackgroundImage";
import Loader from "../../../Components/common/Loader";
import ErrorMessage from "../../../Components/common/ErrorMessage";
import "../../../Pages/menuB2B/SanitizacionesYMantenimientos/SanitizacionesYMantenimientos.css";
import { HelpButton, HelpMenu } from "../../../Components/Help/helpmenu";
import {
    obtenerDelegacionesVista,
    obtenerRegionActual,
    resolverMainplant,
} from "../../../config/regionConfig";


export default function SanitizacionesYMantenimientosPage() {
    const { user } = useAuth();
    const { selectedRegion, selectedDelegations } = useSelection();
    const navigate = useNavigate();

    const [sanitizaciones, setSanitizaciones] = useState<Sanitizacion[]>([]);
    const [avisos, setAvisos] = useState<AvisoLimpieza[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fondo consistente
    useBackgroundImage('/img/Fondo_Escritorio_2.jpg', 'Sanitizaciones');

    // ─── Lógica de Seguridad y Parámetros ─────────────────────────────────────

    const regionParam = useMemo(
        () => obtenerRegionActual(selectedRegion, user?.regiones),
        [selectedRegion, user?.regiones]
    );

    const allowed = useMemo(
        () => obtenerDelegacionesVista(user?.delegaciones, regionParam, "SANMTTO"),
        [user?.delegaciones, regionParam]
    );

    const mainplant = useMemo(() => {
        return resolverMainplant({
            seleccion: selectedDelegations,
            permitidas: allowed,
            modo: "filtrado",
            devolverNullSinPermitidas: true,
        });
    }, [selectedDelegations, allowed]);

    useEffect(() => {
        if (mainplant === null) navigate("/hub");
    }, [mainplant, navigate]);

    // ─── Carga de Datos ───────────────────────────────────────────────────────

    const cargarDatos = useCallback(async (silent = false) => {
        if (!mainplant) {
            setLoading(false);
            return;
        }
        if (!silent) setLoading(true);
        setError(null);
        try {
            const { sanitizaciones: s, avisos: a } = await fetchDailyMaintenance(mainplant);
            setSanitizaciones(s);
            setAvisos(a);
        } catch (e) {
            console.error("[Maintenance] Error cargando datos:", e);
            setError("No se pudieron cargar las tablas de sanitizaciones.");
        } finally {
            setLoading(false);
        }
    }, [mainplant]);

    useEffect(() => {
        cargarDatos();
        const interval = setInterval(() => cargarDatos(true), 60_000);
        return () => clearInterval(interval);
    }, [cargarDatos]);
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    return (
        <>
            <HelpButton onClick={() => setIsHelpOpen(true)} />
            <HelpMenu
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                subView="logistica"
            />
            <ErrorMessage message={error || ''} onClear={() => setError(null)} />
            {loading ? (
                <Loader />
            ) : (
                mainplant && (
                    <SanitizacionesView
                        sanitizaciones={sanitizaciones}
                        avisos={avisos}
                        loading={loading}
                        error={error}
                        columnas={getColumnas(mainplant)}
                    />
                )
            )}
        </>
    );
}
  