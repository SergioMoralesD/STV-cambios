import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelection } from "../../../Context/SelectionContext";
import { fetchAveriasRepetitivas, fetchAveriasRepetitivasAno, type MachineData } from "../../../services/averiaService";
import { remoteLog } from "../../../utils/logger";

import { useAuth } from "../../../Context/AuthContext";
import AveriasRepetitivasTexto from "../../../Components/AveriasRepetitivas/AveriasRepetitivasTexto";
import Loader from "../../../Components/common/Loader";
import ErrorMessage from "../../../Components/common/ErrorMessage";
import useBackgroundImage from "../../../Hooks/useBackgroundImage";
import { HelpButton, HelpMenu } from "../../../Components/Help/helpmenu";
import {
    extraerDelegacionesDesdeMainplant,
    obtenerColumnasAgrupadas,
    obtenerDelegacionesVista,
    obtenerRegionActual,
    resolverMainplant,
} from "../../../config/regionConfig";
import "./AveriasRepetitivas.css";

export default function AveriasRepetitivasPage() {
    const { user } = useAuth();
    const { selectedRegion, selectedDelegations } = useSelection();
    const navigate = useNavigate();

    const regionParam = useMemo(
        () => obtenerRegionActual(selectedRegion, user?.regiones),
        [selectedRegion, user?.regiones]
    );

    const allowed = useMemo(
        () => obtenerDelegacionesVista(user?.delegaciones, regionParam, "AVREPE"),
        [user?.delegaciones, regionParam]
    );

    const mainplant = useMemo(() => {
        const resolved = resolverMainplant({
            seleccion: selectedDelegations,
            permitidas: allowed,
            modo: "estricto",
        });

        if (resolved === null && selectedDelegations && selectedDelegations !== "C" && selectedDelegations !== "B") {
            console.warn("ACCESO DENEGADO: Intento de acceso a delegación no permitida.");
        }

        return resolved;
    }, [selectedDelegations, allowed]);

    // 3. Efecto de seguridad: Redirigir si el acceso no es válido
    useEffect(() => {
        if (mainplant === null) {
            navigate("/hub");
        }
        remoteLog(`AveriasRepetitivasPage: ${mainplant}`, { level: 'INFO', context: 'AveriasRepetitivasPage' });
    }, [mainplant, navigate]);

    const [dataSemana, setDataSemana] = useState<MachineData[]>([]);
    const [dataAno, setDataAno] = useState<MachineData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const lastFetchedMainplant = useRef<string | null>(null);

    // Fondo consistente con el resto de la App
    useBackgroundImage('/img/Fondo_Escritorio_2.jpg', 'Averías Repetitivas');

    const cargarDatos = useCallback(async (silent = false) => {
        if (!mainplant) return; // Si no hay permiso, no cargamos nada

        // Evitar peticiones duplicadas si ya tenemos los datos para este mainplant
        // (Excepto si es un refresco silencioso)
        if (!silent && lastFetchedMainplant.current === mainplant) {
            return;
        }

        try {
            if (!silent) setLoading(true);
            setError(null);

            const [resultSemana, resultAno] = await Promise.all([
                fetchAveriasRepetitivas(mainplant),
                fetchAveriasRepetitivasAno(mainplant)
            ]);

            lastFetchedMainplant.current = mainplant;

            setDataSemana(resultSemana);
            setDataAno(resultAno);
        } catch (err) {
            console.error("Error cargando repetitivas:", err);
            setError("No se pudieron cargar las averías repetitivas. Error en el servidor.");
        } finally {
            setLoading(false);
        }
    }, [mainplant]);

    useEffect(() => {
        cargarDatos();
        // Refresco automático cada 1 minuto (60000 ms)
        const interval = setInterval(() => cargarDatos(true), 60000);
        remoteLog(`AveriasRepetitivasPage: ${mainplant}`, { level: 'INFO', context: 'AveriasRepetitivasPage' });
        return () => clearInterval(interval);
    }, [cargarDatos]);

    return (
        <>
            <HelpMenu
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                subView={"averiasrepetitivas"} // Asegúrate de tener esta vista en tu helpConfig
            />
            <HelpButton onClick={() => setIsHelpOpen(true)} />

            {loading && <Loader />}

            <ErrorMessage
                message={error || ''}
                onClear={() => setError(null)}
            />

            {!loading && mainplant && (
                <AveriasRepetitivasTexto
                    islas={obtenerColumnasAgrupadas(mainplant)}
                    dataSemana={dataSemana}
                    dataAno={dataAno}
                    error={error}
                    onCloseError={() => setError(null)}
                    onBack={() => navigate(-1)}
                />
            )}
        </>
    );
}

  