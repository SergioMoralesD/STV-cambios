import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../Context/AuthContext";
import { useSelection } from "../../../Context/SelectionContext";
import { remoteLog } from "../../../utils/logger";
import type {
    Tecnico,
    Averia,
    ResumenList,
    ResumenGenExec,
    AllMetricas,
} from "../../../services/Types";
import {
    fetchAveriasYTecnicos,
    fetchResumen,
    fetchTecnicosNecesarios,
    fetchSlaObjetivo
} from "../../../services/averiaService";
import { fetchMetricas } from "../../../services/metricasService";
import { fetchTecnicoInfo, fetchAveriasTecnico } from "../../../services/tecnicoService";

import TablaTecnicos from "../../../Components/averias/TecnicoCard";
import TablaResumen from "../../../Components/averias/TablaResumen";
import SlaObjetivo from "../../../Components/averias/SlaObjetivo";
import MedidoresCocacola from "../../../Components/MedidoresCocacola/MedidoresCocacola";
import Loader from "../../../Components/common/Loader";
import ErrorMessage from "../../../Components/common/ErrorMessage";
import useBackgroundImage from "../../../Hooks/useBackgroundImage";
import { HelpButton, HelpMenu } from "../../../Components/Help/helpmenu";
import {
    obtenerDelegacionesVista,
    obtenerRegionActual,
    resolverMainplant,
} from "../../../config/regionConfig";
import "./AveriasPage.css";

interface AveriasDashboardProps {
    mainplant?: string;
    codTecnico?: string;
}

interface DashboardState {
    tecnicos: Tecnico[];
    averias: Averia[];
    resumenList: ResumenList | null;
    resumenGen: ResumenGenExec | null;
    resumenExec: ResumenGenExec | null;
    metricas: AllMetricas | null;
    numTecnicos: number | "Error";
    slaObjetivo: number;
    loading: boolean;
    loadingMetricas: boolean;
    error: string | null;
}

export default function AveriasDashboard({ mainplant: mainplantProp, codTecnico }: AveriasDashboardProps) {
    const { user } = useAuth();
    const { selectedRegion, selectedDelegations } = useSelection();
    const navigate = useNavigate();

    // Estado local para los datos del técnico (petición 79)
    const [tecnicoData, setTecnicoData] = useState<{ mainplant: string; nombre: string } | null>(null);
    const [state, setState] = useState<DashboardState>({
        tecnicos: [],
        averias: [],
        resumenList: null,
        resumenGen: null,
        resumenExec: null,
        metricas: null,
        numTecnicos: 0,
        slaObjetivo: 0,
        loading: true,
        loadingMetricas: true,
        error: null,
    });
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    const regionParam = useMemo(
        () => obtenerRegionActual(selectedRegion, user?.regiones),
        [selectedRegion, user?.regiones]
    );

    const allowed = useMemo(
        () => obtenerDelegacionesVista(user?.delegaciones, regionParam, "AVERIAS"),
        [user?.delegaciones, regionParam]
    );

    const mainplant = useMemo(() => {
        // MODO TÉCNICO
        if (codTecnico) {
            if (tecnicoData === null) return null; // Esperando a pet 79
            if (tecnicoData.mainplant === '') return null; // Falló pet 79
            return tecnicoData.mainplant;
        }

        // MODO NORMAL (Coordinador / Admin)
        const param = mainplantProp ?? selectedDelegations;
        const resolved = resolverMainplant({
            seleccion: param,
            permitidas: allowed,
            modo: "estricto",
            devolverNullSinPermitidas: true,
        });

        return resolved;
    }, [mainplantProp, selectedDelegations, allowed, codTecnico, tecnicoData]);

    const hasMainplant = Boolean(mainplant && mainplant.trim().length > 0);
    const lastFetchedMainplant = useRef<string | null>(null);

    // Cargo info del técnico si estamos en modo técnico
    useEffect(() => {
        if (codTecnico && !tecnicoData) {
            fetchTecnicoInfo(codTecnico)
                .then(info => {
                    if (info?.CODIGO_AREA) {
                        setTecnicoData({
                            mainplant: info.CODIGO_AREA,
                            nombre: info.NOMBRE_EMPLEADO || 'Técnico'
                        });
                    } else {
                        setTecnicoData({ mainplant: '', nombre: '' });
                        setState(s => ({
                            ...s,
                            loading: false,
                            loadingMetricas: false,
                            error: "No se encontró información de área para su perfil de técnico."
                        }));
                    }
                })
                .catch(err => {
                    setTecnicoData({ mainplant: '', nombre: '' });
                    remoteLog(`Error fetching tecnico info: ${err}`, { level: 'ERROR', context: 'AveriasPage' });
                    setState(s => ({
                        ...s,
                        loading: false,
                        loadingMetricas: false,
                        error: "Error al recuperar su información técnica."
                    }));
                });
        }
    }, [codTecnico, tecnicoData]);

    // 3. Redirección si no hay permiso y Logging consolidado
    useEffect(() => {
        if (mainplant === null && !codTecnico) {
            navigate("/hub");
        }

        if (mainplant === null) {
            const param = mainplantProp ?? selectedDelegations;
            if (param && param !== "C" && param !== "B") {
                remoteLog(`ACCESO DENEGADO (AVERIAS): Intento de acceso no autorizado por ${user?.usuario} a ${param}`, { level: 'WARN', context: 'AveriasPage' });
            }
            remoteLog(`AveriasPage: null`, { level: 'INFO', context: 'AveriasPage' });
        } else {
            remoteLog(`AveriasPage: ${mainplant}`, { level: 'INFO', context: 'AveriasPage' });
        }
    }, [mainplant, navigate, codTecnico, user?.usuario, mainplantProp, selectedDelegations]);

    // Forzar fondo con imagen en el body cuando este componente está activo
    useBackgroundImage('/img/Fondo_Escritorio_2.jpg', 'Averías');

    const cargarDatos = useCallback(async (silent = false) => {
        if (!hasMainplant || !mainplant) {
            if (codTecnico && !tecnicoData) return;
            setState((s) => ({
                ...s,
                loading: false,
                loadingMetricas: false,
                error: (codTecnico && tecnicoData && !tecnicoData.mainplant) 
                    ? "Su perfil de técnico no tiene una delegación asignada." 
                    : "Falta el parametro mainplant.",
            }));
            return;
        }

        if (!silent && lastFetchedMainplant.current === mainplant) {
            return;
        }

        const mp = mainplant;
        setState((s) => ({
            ...s,
            loading: silent ? s.loading : true,
            error: null,
        }));
        try {
            const averiasPromise = codTecnico
                ? fetchAveriasTecnico(mp, codTecnico).then(data => {
                    const dataMapped = data.map(a => ({
                        ...a,
                        cod_tec: a.cod_tec || String(codTecnico)
                    }));
                    const virtualTec: Tecnico = {
                        codigo: String(codTecnico),
                        nombre: tecnicoData?.nombre || 'Mi Perfil',
                        fototec: ''
                    };
                    return { averias: dataMapped, tecnicos: [virtualTec] };
                })
                : fetchAveriasYTecnicos(mp);

            const tasks: Promise<any>[] = [averiasPromise];
            if (!codTecnico) {
                tasks.push(fetchResumen(mp));
                tasks.push(fetchMetricas(mp));
            }

            const [averiasResult, resumenResult, metricasResult] = await Promise.allSettled(tasks);
            lastFetchedMainplant.current = mp;

            setState((s) => {
                const next = { ...s, loading: false, loadingMetricas: false };
                if (averiasResult && averiasResult.status === "fulfilled") {
                    next.tecnicos = averiasResult.value.tecnicos || [];
                    next.averias = averiasResult.value.averias || [];
                } else if (averiasResult && averiasResult.status === "rejected") {
                    next.error = "No se pudieron cargar las tablas de averías.";
                }

                if (resumenResult && resumenResult.status === "fulfilled") {
                    next.resumenList = resumenResult.value.list;
                    next.resumenGen = resumenResult.value.generated;
                    next.resumenExec = resumenResult.value.executed;
                }
                if (metricasResult && metricasResult.status === "fulfilled") {
                    next.metricas = metricasResult.value;
                }
                return next;
            });

            if (!codTecnico) {
                try {
                    const slaData = await fetchSlaObjetivo(mp);
                    const slaObjetivo = slaData.sla_objetivo;
                    if (slaObjetivo) {
                        const numTec = await fetchTecnicosNecesarios(mp, slaObjetivo);
                        setState((s) => ({ ...s, numTecnicos: numTec, slaObjetivo }));
                    }
                } catch (e) {}
            }
        } catch (e) {
            remoteLog(`Error de conexión API en AveriasPage: ${e}`, { level: 'ERROR' });
            setState((s) => ({
                ...s,
                loading: false,
                error: "Error de conexión con la API.",
            }));
        }
    }, [mainplant, hasMainplant, codTecnico, tecnicoData]);

    useEffect(() => {
        cargarDatos();
        const interval = setInterval(() => cargarDatos(true), 60_000);
        return () => clearInterval(interval);
    }, [cargarDatos]);

    useEffect(() => {
        const mainContent = document.querySelector('.layout-main-content');
        if (mainContent) {
            mainContent.classList.add('no-scroll');
        }
        return () => {
            if (mainContent) {
                mainContent.classList.remove('no-scroll');
            }
        };
    }, []);

    function handleSlaUpdate(numTec: number | "Error", sla: number) {
        setState((s) => ({ ...s, numTecnicos: numTec, slaObjetivo: sla }));
    }

    return (
        <div className="averias-page-container">
            <HelpMenu
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                subView={"averias"}
            />
            {!codTecnico && <HelpButton onClick={() => setIsHelpOpen(true)} />}
            {state.loading && <Loader />}

            <ErrorMessage
                message={state.error || ''}
                onClear={() => setState((s) => ({ ...s, error: null }))}
            />

            {!state.loading && mainplant && (
                <div className={codTecnico ? "tecnico-view-only" : "tecnicos-container"}>

                    {codTecnico && state.averias.length === 0 ? (
                        <div className="no-averias-notice">
                            No tienes averías asignadas en este momento.
                        </div>
                    ) : (
                        <TablaTecnicos tecnicos={state.tecnicos} averias={state.averias} />
                    )}
                </div>
            )}

            {!codTecnico && !state.loading && (
                <div id="table2">
                    <div className="left-bottom-group">
                        {mainplant && (
                            <SlaObjetivo
                                mainplant={mainplant}
                                numTecnicos={state.numTecnicos}
                                slaActual={state.slaObjetivo}
                                onUpdate={handleSlaUpdate}
                            />
                        )}

                        {state.resumenList && state.resumenGen && state.resumenExec && (
                            <TablaResumen
                                list={state.resumenList!}
                                generated={state.resumenGen!}
                                executed={state.resumenExec!}
                            />
                        )}
                    </div>

                    {state.metricas && (
                        <MedidoresCocacola
                            metricas={state.metricas}
                            loading={state.loadingMetricas}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
  