import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../Context/AuthContext";
import { useSelection } from "../../../Context/SelectionContext";
import { fetchTrabajoCliente } from "../../../services/trabajoClienteService";
import TrabajoClienteDashboardTexto from "../../../Components/TrabajoCliente/TrabajoClienteDashboardTexto";
import Loader from "../../../Components/common/Loader";
import useBackgroundImage from "../../../Hooks/useBackgroundImage";
import { HelpButton, HelpMenu } from "../../../Components/Help/helpmenu"
import {
    obtenerColumnasIslaObjetos,
    obtenerDelegacionesVista,
    obtenerRegionActual,
    resolverMainplant,
} from "../../../config/regionConfig";

export default function TrabajoClientePage() {
    const { user } = useAuth();
    const { selectedRegion, selectedDelegations } = useSelection();
    const navigate = useNavigate();

    const regionParam = useMemo(
        () => obtenerRegionActual(selectedRegion, user?.regiones),
        [selectedRegion, user?.regiones]
    );

    const allowed = useMemo(
        () => obtenerDelegacionesVista(user?.delegaciones, regionParam, "TRABCL"),
        [user?.delegaciones, regionParam]
    );

    const mainplant = useMemo(() => {
        return resolverMainplant({
            seleccion: selectedDelegations,
            permitidas: allowed,
            modo: "estricto",
        });
    }, [selectedDelegations, allowed]);

    // Redirección si no hay acceso
    useEffect(() => {
        if (mainplant === null) {
            navigate("/hub");
        }
    }, [mainplant, navigate]);

    const [averias, setAverias] = useState<unknown[]>([]);
    const [loading, setLoading] = useState(true);
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    useBackgroundImage('/img/Fondo_Escritorio_2.jpg', 'Trabajo en Cliente');

    const cargarDatos = useCallback(async (silent = false) => {
        if (!mainplant) return;
        if (!silent) setLoading(true);
        try {
            const data = await fetchTrabajoCliente(mainplant);
            setAverias(data);
        } catch (e) {
            console.error("Error cargando Trabajo Cliente:", e);
        } finally {
            setLoading(false);
        }
    }, [mainplant]);

    useEffect(() => {
        cargarDatos();
        const i = setInterval(() => cargarDatos(true), 60000); // 1 minuto
        return () => clearInterval(i);
    }, [cargarDatos]);

    const columnas = useMemo(() => (mainplant ? obtenerColumnasIslaObjetos(mainplant, user?.rol_nombre) : []), [mainplant, user?.rol_nombre]);

    if (!mainplant) return null;

    return (
        <>
            <HelpMenu
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                subView={"trabajocliente"}
            />
            <HelpButton onClick={() => setIsHelpOpen(true)} />

            {loading && <Loader />}
            <TrabajoClienteDashboardTexto
                averias={averias}
                loading={loading}
                columnas={columnas}
            />
        </>
    );
}
  