import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../Context/AuthContext";
import { useSelection } from "../../../Context/SelectionContext";
import { useRankingData } from "../../../Hooks/useRankingData";
import FiltroRegiones from "../../../Components/ProducTecnicos/FiltroRegiones";
import LineaTiempoTecnico from "../../../Components/ProducTecnicos/LineaTiempoTecnico";
import Loader from "../../../Components/common/Loader";
import ErrorMessage from "../../../Components/common/ErrorMessage";
import useBackgroundImage from "../../../Hooks/useBackgroundImage";
import {
  obtenerDelegacionesVista,
  obtenerRegionActual,
  resolverMainplant,
  obtenerNombreRegion,
  obtenerNombreIsla,
} from "../../../config/regionConfig";
import { getDuracionTarea } from "../../../utils/timeUtils";
import "./estilostats.css";
import "./tablastats.css";

export default function Productividad() {
  const { user } = useAuth();
  const { selectedRegion, selectedDelegations } = useSelection();
  const navigate = useNavigate();

  useBackgroundImage("/img/Fondo_Escritorio_2.jpg", "Ranking Productividad de tecnicos");

  const regionParam = useMemo(
    () => obtenerRegionActual(selectedRegion, user?.regiones),
    [selectedRegion, user?.regiones],
  );

  const allowed = useMemo(() => {
    const rankprod = obtenerDelegacionesVista(user?.delegaciones, regionParam, "RANKPROD");
    if (rankprod.length > 0) return rankprod;

    const prodtec = obtenerDelegacionesVista(user?.delegaciones, regionParam, "PRODTEC");
    if (prodtec.length > 0) return prodtec;

    return obtenerDelegacionesVista(user?.delegaciones, regionParam, "AVERIAS");
  }, [user?.delegaciones, regionParam]);

  const mainplant = useMemo(
    () =>
      resolverMainplant({
        seleccion: selectedDelegations,
        permitidas: allowed,
        modo: "filtrado",
        devolverNullSinPermitidas: true,
      }),
    [selectedDelegations, allowed],
  );

  useEffect(() => {
    if (mainplant === null) {
      navigate("/hub");
    }
  }, [mainplant, navigate]);

  const initialFecha = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [fechaConsultaInput, setFechaConsultaInput] = useState(initialFecha);
  const [fechaConsultaAplicada, setFechaConsultaAplicada] = useState(initialFecha);

  // Listener nativo para simular el "change" real sin capturar los eventos intermedios (como el cambio de mes)
  useEffect(() => {
    const inputFecha = document.getElementById("fechaConsulta") as HTMLInputElement;
    const manejarCambioFecha = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target && target.value) {
        setFechaConsultaAplicada(target.value);
      }
    };

    if (inputFecha) {
      inputFecha.addEventListener("change", manejarCambioFecha);
    }
    return () => {
      if (inputFecha) {
        inputFecha.removeEventListener("change", manejarCambioFecha);
      }
    };
  }, []);

  const {
    tecnicos,
    setTecnicos,
    tareasPorTecnico,
    jornadaPorTecnico,
    cargando,
    dataLoaded,
    errorMsg,
  } = useRankingData(fechaConsultaAplicada, mainplant, "125");

  const tecnicosOrdenados = useMemo(() => {
    return [...tecnicos].sort((a, b) => {
      const tareasA = tareasPorTecnico[a.codigo] || [];
      const minA = tareasA.reduce((acc, t) => acc + getDuracionTarea(t.FECHA_INI, t.FECHA_FIN, t.DELEGACION || a.delegacion), 0);

      const tareasB = tareasPorTecnico[b.codigo] || [];
      const minB = tareasB.reduce((acc, t) => acc + getDuracionTarea(t.FECHA_INI, t.FECHA_FIN, t.DELEGACION || b.delegacion), 0);

      return minB - minA;
    });
  }, [tecnicos, tareasPorTecnico]);

  const checkedCodes = useMemo(
    () => new Set(tecnicos.filter((t) => t.mostrar).map((t) => t.codigo)),
    [tecnicos],
  );
  const [notificacion, setNotificacion] = useState<string | null>(null);
  const [dismissedError, setDismissedError] = useState<string | null>(null);

  const copiarAPortapapeles = useCallback(async (texto: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(texto);
      } else {
        const input = document.createElement("input");
        input.style.position = "absolute";
        input.style.left = "-9999px";
        input.value = texto;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setNotificacion(`Código del aviso copiado: ${texto}`);
      setTimeout(() => setNotificacion(null), 2500);
    } catch (error) {
      console.error("Error copiando:", error);
    }
  }, []);

  const toggleCheckDelegacion = (delegacion: string) => {
    const tecnicosDelegacion = tecnicos.filter((t) => t.delegacion === delegacion);
    const todosChecked = tecnicosDelegacion.every((t) => checkedCodes.has(t.codigo));

    setTecnicos((prev) =>
      prev.map((t) => {
        if (t.delegacion !== delegacion) return t;
        return { ...t, mostrar: !todosChecked };
      }),
    );
  };

  const toggleCheckTecnico = (codigo: string) => {
    setTecnicos((prev) =>
      prev.map((t) => {
        if (t.codigo !== codigo) return t;
        return { ...t, mostrar: !t.mostrar };
      }),
    );
  };

  const handleEvaluar = () => { };

  const handleMouseEnter = (content: string) => {
    const hoverDiv = document.getElementById("divHoverRanking");
    if (!hoverDiv) return;
    hoverDiv.innerHTML = content;
    hoverDiv.style.display = "block";
  };

  const handleMouseMove = (e: MouseEvent) => {
    const hoverDiv = document.getElementById("divHoverRanking");
    if (!hoverDiv) return;
    hoverDiv.style.left = `${e.clientX + 10}px`;
    hoverDiv.style.top = `${e.clientY + 10}px`;
  };

  const handleMouseLeave = () => {
    const hoverDiv = document.getElementById("divHoverRanking");
    if (hoverDiv) hoverDiv.style.display = "none";
  };

  const regionName = useMemo(() => obtenerNombreRegion(regionParam), [regionParam]);
  const areaName = useMemo(() => {
    if (!mainplant) return "";
    const firstCode = mainplant.split("-")[0];
    return obtenerNombreIsla(firstCode);
  }, [mainplant]);

  if (!mainplant) {
    return null;
  }

  return (
    <div id="ranking-tecnicos-page">
      <div className="ranking-header">
        <div className="ranking-title-container">
          <h1 className="ranking-title">
            {areaName} - {regionName}
          </h1>
        </div>

        <div id="fechas">
          <div className="fecha-row">
            <label id="labelFecha">Fecha de Consulta:</label>
            <input
              id="fechaConsulta"
              type="date"
              value={fechaConsultaInput}
              disabled={cargando}
              onChange={(e) => setFechaConsultaInput(e.target.value)}
            />
          </div>

          <div className="botones-row" style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
            <button id="botonProductividad" onClick={() => navigate("/productividad")}>
              Estadísticas
            </button>
          </div>
        </div>
      </div>

      {cargando && <Loader />}

      <ErrorMessage
        message={!cargando && errorMsg && dismissedError !== errorMsg ? errorMsg : ""}
        onClear={() => setDismissedError(errorMsg)}
      />

      {dataLoaded && (
        <FiltroRegiones
          tecnicos={tecnicos}
          checkedCodes={checkedCodes}
          toggleCheckDelegacion={toggleCheckDelegacion}
          toggleCheckTecnico={toggleCheckTecnico}
          handleEvaluar={handleEvaluar}
          cargando={cargando}
        />
      )}

      {!cargando && dataLoaded && (
        <div id="tablaTecnicos" className="tablaGrande">
          {tecnicosOrdenados.map((tec) => (
            <LineaTiempoTecnico
              key={tec.codigo}
              tec={tec}
              tareas={tareasPorTecnico[tec.codigo] || []}
              jornada={jornadaPorTecnico[tec.codigo] || null}
              handleMouseEnter={handleMouseEnter}
              handleMouseMove={handleMouseMove}
              handleMouseLeave={handleMouseLeave}
              copiarAPortapapeles={copiarAPortapapeles}
              fixedRange={[6, 23]}
              layout="column"
            />
          ))}
        </div>
      )}

      <div id="divHoverRanking" className="divHover" />
      {notificacion && <div className="notificacion-ranking mostrar">{notificacion}</div>}
    </div>
  );
}  