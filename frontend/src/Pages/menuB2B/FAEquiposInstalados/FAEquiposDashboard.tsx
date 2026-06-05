// src/webs/FAEquiposInstalados/FAEquiposDashboard.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import type { FAEquipo } from "../../../services/Types";
import { ISLA_IMG } from "../../../services/helpers";
import { fetchFAEquiposInstalados } from "../../../services/instaladosService";
import { IslaTable } from "../../../Components/FASEquiposRecienInstalados/IslaTable";
import { Loader } from "../../../Components/common/Loader";
import useBackgroundImage from "../../../Hooks/useBackgroundImage";
import { remoteLog } from "../../../utils/logger";
import {
    formatearFechaParaAPI,
    getFechaHaceUnMesISO,
    getFechaHoyISO,
    parseMpsConImagenes,
} from "../../../config/regionConfig";
import "./FAEquiposDashboard.css";

// ─── TIPOS ────────────────────────────────────────────────────────────────

interface Mainplant {
    mainplant: string;
    is: string;
}

interface TooltipState {
    text: string;
    x: number;
    y: number;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────

interface Props {
    mps: string;
}

// Subcomponente de filtros para evitar re-renders que cierren el calendario
const FiltrosFechas = memo(({ 
    fechaInicio, 
    fechaFin, 
    onInicioChange, 
    onFinChange,
    onBlur
}: { 
    fechaInicio: string, 
    fechaFin: string, 
    onInicioChange: (val: string) => void, 
    onFinChange: (val: string) => void,
    onBlur: () => void
}) => {
    return (
        <div id="fechas">
            <div className="fecha-group">
                <label htmlFor="fechaInicio">Fecha de inicio de Consulta:</label>
                <input
                    type="date"
                    id="fechaInicio"
                    value={fechaInicio}
                    onChange={(e) => onInicioChange(e.target.value)}
                    onBlur={onBlur}
                />
            </div>
            <div className="fecha-group">
                <label htmlFor="fechaFin">Fecha de fin de Consulta:</label>
                <input
                    type="date"
                    id="fechaFin"
                    value={fechaFin}
                    onChange={(e) => onFinChange(e.target.value)}
                    onBlur={onBlur}
                />
            </div>
        </div>
    );
});

export default function FAEquiposDashboard({ mps }: Props) {
    const mainplants = parseMpsConImagenes(mps, ISLA_IMG) as Mainplant[];

    const [datos, setDatos] = useState<FAEquipo[]>([]);
    const [fechaInicioInput, setFechaInicioInput] = useState<string>(getFechaHaceUnMesISO());
    const [fechaFinInput, setFechaFinInput] = useState<string>(getFechaHoyISO());
    const [fechaInicioAplicada, setFechaInicioAplicada] = useState<string>(getFechaHaceUnMesISO());
    const [fechaFinAplicada, setFechaFinAplicada] = useState<string>(getFechaHoyISO());
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [tooltip, setTooltip] = useState<TooltipState | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useBackgroundImage('/img/Fondo_Escritorio_2.jpg', 'FA Equipos Instalados');

    const lastAppliedRef = useRef({ inicio: fechaInicioInput, fin: fechaFinInput });

    const applyChanges = useCallback(() => {
        setFechaInicioAplicada(fechaInicioInput);
        setFechaFinAplicada(fechaFinInput);
        lastAppliedRef.current = { inicio: fechaInicioInput, fin: fechaFinInput };
    }, [fechaInicioInput, fechaFinInput]);

    useEffect(() => {
        const dayInicioChanged = fechaInicioInput.split('-')[2] !== lastAppliedRef.current.inicio.split('-')[2];
        const dayFinChanged = fechaFinInput.split('-')[2] !== lastAppliedRef.current.fin.split('-')[2];
        
        // Solo cargamos automáticamente si ha cambiado el día (selección directa)
        if (dayInicioChanged || dayFinChanged) {
            const timer = setTimeout(applyChanges, 400);
            return () => clearTimeout(timer);
        }
    }, [fechaInicioInput, fechaFinInput, applyChanges]);

    const handleMouseEnter = (e: React.MouseEvent, text: string) => {
        const x = e.clientX;
        const y = e.clientY;
        timeoutRef.current = setTimeout(() => {
            setTooltip({ text, x, y });
        }, 300);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setTooltip(null);
    };

    const cargarDatos = useCallback(async (silent = false) => {
        if (mainplants.length === 0) {
            setLoading(false);
            return;
        }
        if (datos.length === 0 && !silent) setLoading(true);
        setError(null);
        try {
            const resultado = await fetchFAEquiposInstalados(
                mainplants.map((m) => m.mainplant),
                formatearFechaParaAPI(fechaInicioAplicada),
                formatearFechaParaAPI(fechaFinAplicada),
            );
            setDatos(Array.isArray(resultado) ? resultado : []);
        } catch (err) {
            console.error("Error al cargar datos:", err);
            setError(
                "No se pudieron cargar los datos. Por favor, recarga la página o informa al responsable técnico.",
            );
        } finally {
            setLoading(false);
        }
    }, [fechaInicioAplicada, fechaFinAplicada, mps]);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    useEffect(() => {
        const interval = setInterval(() => cargarDatos(true), 60000);
        remoteLog(`FAEquiposDashboard: ${mps}`, { level: 'INFO', context: 'FAEquiposDashboard' });
        return () => clearInterval(interval);
    }, [cargarDatos, mps]);

    return (
        <div className="fa-escritorio-layout">
            {/* CABECERA */}
            <div id="headDiv">
                {/* FILTROS DE FECHA */}
                <FiltrosFechas 
                    fechaInicio={fechaInicioInput}
                    fechaFin={fechaFinInput}
                    onInicioChange={setFechaInicioInput}
                    onFinChange={setFechaFinInput}
                    onBlur={applyChanges}
                />
            </div>

            {/* ERROR */}
            {error && (
                <div className="error-banner">
                    <span>{error}</span>
                    <span className="cruzError" onClick={() => setError(null)}>
                        ✕
                    </span>
                </div>
            )}

            {/* TABLAS */}
            {loading && <Loader />}

            <div 
                id="rowTables"
                style={{ 
                    opacity: loading ? 0.6 : 1, 
                    pointerEvents: loading ? 'none' : 'auto',
                    transition: 'opacity 0.2s ease'
                }}
            >
                {mainplants.map((isla) => (
                    <IslaTable
                        key={isla.mainplant}
                        isla={isla}
                        datos={datos.filter((d) => d.delegacion === isla.mainplant)}
                        totalIslas={mainplants.length}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    />
                ))}
            </div>


            {/* TOOLTIP GLOBAL VIA PORTAL */}
            {tooltip &&
                createPortal(
                    <div
                        className="custom-tooltip"
                        style={{ top: tooltip.y + 12, left: tooltip.x + 12 }}
                    >
                        {tooltip.text}
                    </div>,
                    document.body,
                )}
        </div>
    );
}
  