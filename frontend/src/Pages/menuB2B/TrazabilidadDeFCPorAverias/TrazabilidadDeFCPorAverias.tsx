import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import type { MaquinaRetirada } from "../../../services/Types";
import { ISLA_IMG } from "../../../services/helpers";
import { fetchMaquinasRetiradas } from "../../../services/trazabilidadService";
import { type TooltipState } from "../../../Components/TrazabilidadDeFCPorAverias/types";
import {
  getFechaHoy,
  getFechaMes,
  formatearFechaParaAPI,
  parseMps,
} from "../../../Components/TrazabilidadDeFCPorAverias/helpers";
import IslaTable from "../../../Components/TrazabilidadDeFCPorAverias/IslaTable";
import { HelpButton, HelpMenu } from "../../../Components/Help/helpmenu";
import Loader from "../../../Components/common/Loader";
import ErrorMessage from "../../../Components/common/ErrorMessage";
import "./TrazabilidadDeFCPorAverias.css";
import "../../../App.css";
import useBackgroundImage from "../../../Hooks/useBackgroundImage";


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

export default function TrazabilidadDeFCPorAverias({ mps }: Props) {
  const mainplants = useMemo(() => parseMps(mps, ISLA_IMG), [mps]);

  const [datos, setDatos] = useState<MaquinaRetirada[]>([]);
  const [fechaInicioInput, setFechaInicioInput] = useState<string>(getFechaMes());
  const [fechaFinInput, setFechaFinInput] = useState<string>(getFechaHoy());
  const [fechaInicioAplicada, setFechaInicioAplicada] = useState<string>(getFechaMes());
  const [fechaFinAplicada, setFechaFinAplicada] = useState<string>(getFechaHoy());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

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
      const resultado = await fetchMaquinasRetiradas(
        mainplants.map((m) => m.mainplant),
        formatearFechaParaAPI(fechaInicioAplicada),
        formatearFechaParaAPI(fechaFinAplicada),
      );
      const datosArray = Array.isArray(resultado)
        ? resultado
        : (Object.values(resultado as object).find((v) => Array.isArray(v)) ??
          []);
      setDatos(datosArray as MaquinaRetirada[]);
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
    const interval = setInterval(() => {
      cargarDatos(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [cargarDatos]);
  useBackgroundImage('/img/Fondo_Escritorio_2.jpg', 'Trazabilidad de FC por Averías');

  return (
    <div className="trazabilidad-root">
      <HelpButton onClick={() => setIsHelpOpen(true)} />
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

      <ErrorMessage message={error || ''} onClear={() => setError(null)} />

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
      <HelpMenu
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        subView="trazabilidad"
      />
    </div>
  );
}
  