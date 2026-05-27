import { useEffect, useState } from "react";
import {
    fetchDetalleJornadas,
    fetchDetalleTareas,
    fetchDetalleTecnicos,
    type JornadaData,
    type JornadaRow,
} from "../services/productividadService";
import { formatearFecha, getDuracionTarea, parseFecha } from "../utils/timeUtils";
import type { TecData, TareaData } from "../utils/rankingHelpers";

type TareasPorTecnico = Record<string, TareaData[]>;
type JornadasPorTecnico = Record<string, JornadaData>;

// parseFecha now imported from timeUtils

function mapJornada(row: JornadaRow): JornadaData {
    const inicio = parseFecha(typeof row.FECHA_INI === "string" ? row.FECHA_INI : undefined);
    const finRaw = parseFecha(typeof row.FECHA_FIN === "string" ? row.FECHA_FIN : undefined);
    const fin = inicio && finRaw && inicio.toDateString() === finRaw.toDateString() ? finRaw : null;
    return { inicio, fin };
}

function normalizarCodigo(raw: unknown): string {
    if (raw === null || raw === undefined) return "";
    return String(raw).trim();
}

function getCodTecnico(row: Record<string, unknown>): string {
    const keys = [
        "COD_TECNICO",
        "CODIGO_TECNICO",
        "CODIGO_EMPLEADO",
        "CODIGO",
        "COD_TEC",
        "COD_EMP",
        "CO_EMP",
    ];
    for (const key of keys) {
        const val = row[key];
        if (val !== undefined && val !== null) {
            return String(val).trim();
        }
    }
    return "";
}

export function useTecnicoRankingData(
    fechaInicio: string,
    fechaFin: string,
    codTecnico: string,
    mainplant: string | null,
    tecnicoNombre?: string | null,
) {
    const [tecnicos, setTecnicos] = useState<TecData[]>([]);
    const [tareasPorTecnico, setTareasPorTecnico] = useState<TareasPorTecnico>({});
    const [jornadaPorTecnico, setJornadaPorTecnico] = useState<JornadasPorTecnico>({});
    const [cargando, setCargando] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        const loadData = async (silent = false) => {
            if (!codTecnico || !mainplant) {
                if (!silent) {
                    setTecnicos([]);
                    setTareasPorTecnico({});
                    setJornadaPorTecnico({});
                    setDataLoaded(false);
                }
                return;
            }

            try {
                if (!silent) setCargando(true);
                setErrorMsg(null);

                // Alineamos con la lógica de useRankingData que sí funciona
                const [yI, mI, dI] = fechaInicio.split("-").map(Number);
                const [yF, mF, dF] = fechaFin.split("-").map(Number);
                
                const fIni = formatearFecha(new Date(yI, mI - 1, dI));
                const fFin = formatearFecha(new Date(yF, mF - 1, dF + 1));

                // Usamos las peticiones de DETALLE (71, 85, 134)
                const [tecnicosData, tareasData, jornadasData] = await Promise.all([
                    fetchDetalleTecnicos(codTecnico, fIni, fFin, mainplant),
                    fetchDetalleTareas(codTecnico, fIni, fFin, mainplant),
                    fetchDetalleJornadas(codTecnico, fIni, fFin, mainplant),
                ]);

                if (!active) return;

                const tareasMapped: TareasPorTecnico = {};
                for (const tarea of tareasData) {
                    const codigo = getCodTecnico(tarea as Record<string, unknown>);
                    if (!codigo) continue;
                    if (!tareasMapped[codigo]) tareasMapped[codigo] = [];
                    tareasMapped[codigo].push(tarea);
                }

                const jornadasMapped: JornadasPorTecnico = {};
                for (const row of jornadasData) {
                    const codigo = getCodTecnico(row as unknown as Record<string, unknown>);
                    if (!codigo) continue;
                    jornadasMapped[codigo] = mapJornada(row);
                }

                // Asegurar que el técnico está en la lista aunque el backend de detalle no lo devuelva
                let finalTecnicos = tecnicosData;
                if (finalTecnicos.length === 0 && codTecnico) {
                    finalTecnicos = [{
                        codigo: codTecnico,
                        nombre: tecnicoNombre || `Tecnico ${codTecnico}`,
                        delegacion: mainplant.split("-")[0] || "6S21",
                        mostrar: true
                    }];
                }

                setTecnicos(finalTecnicos);
                setTareasPorTecnico(tareasMapped);
                setJornadaPorTecnico(jornadasMapped);
                setDataLoaded(true);
            } catch (error) {
                console.error("Error cargando productividad tecnico:", error);
                const msg =
                    error instanceof Error && error.message
                        ? error.message
                        : "Error inesperado cargando productividad";
                if (active) {
                    setTecnicos([]);
                    setTareasPorTecnico({});
                    setJornadaPorTecnico({});
                    setDataLoaded(false);
                    setErrorMsg(msg);
                }
            } finally {
                if (active) setCargando(false);
            }
        };

        loadData();
        const interval = setInterval(() => loadData(true), 60000);

        return () => {
            active = false;
            clearInterval(interval);
        };
    }, [fechaInicio, fechaFin, codTecnico, mainplant]);

    return {
        tecnicos,
        setTecnicos,
        tareasPorTecnico,
        jornadaPorTecnico,
        cargando,
        dataLoaded,
        errorMsg,
    };
}
  