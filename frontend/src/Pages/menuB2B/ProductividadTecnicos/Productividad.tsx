import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../Context/AuthContext";
import { useSelection } from "../../../Context/SelectionContext";
import { useRankingData } from "../../../Hooks/useRankingData";
import { useTecnicoRankingData } from "../../../Hooks/useTecnicoRankingData";
import FiltroRegiones from "../../../Components/ProducTecnicos/FiltroRegiones";
import LineaTiempoTecnico from "../../../Components/ProducTecnicos/LineaTiempoTecnico";
import Loader from "../../../Components/common/Loader";
import ErrorMessage from "../../../Components/common/ErrorMessage";
import {
  obtenerDelegacionesVista,
  obtenerRegionActual,
  resolverMainplant,
  obtenerNombreRegion,
  obtenerNombreIsla,
} from "../../../config/regionConfig";
import { getDuracionTarea } from "../../../utils/timeUtils";
import useBackgroundImage from "../../../Hooks/useBackgroundImage";
import { fetchTecnicoInfo } from "../../../services/tecnicoService";
import "./estilostats.css";
import "./tablastats.css";

interface ProductividadProps {
  codTecnico?: string;
}


export default function Productividad({ codTecnico }: ProductividadProps) {
  const { user } = useAuth();
  const { selectedRegion, selectedDelegations } = useSelection();
  const navigate = useNavigate();

  // Estado local para los datos del técnico en modo técnico
  const [tecnicoArea, setTecnicoArea] = useState<string | null>(null);

  useBackgroundImage("/img/Fondo_Escritorio_2.jpg", "Productividad de tecnicos");

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

  const mainplant = useMemo(() => {
    if (codTecnico && tecnicoArea) return tecnicoArea;
    if (codTecnico && !tecnicoArea) return null;

    return resolverMainplant({
      seleccion: selectedDelegations,
      permitidas: allowed,
      modo: "filtrado",
      devolverNullSinPermitidas: true,
    });
  }, [selectedDelegations, allowed, codTecnico, tecnicoArea]);

  // Cargar info del técnico si estamos en modo técnico para obtener su mainplant
  useEffect(() => {
    if (codTecnico && !tecnicoArea) {
      fetchTecnicoInfo(codTecnico)
        .then(info => {
          if (info?.CODIGO_AREA) {
            setTecnicoArea(info.CODIGO_AREA);
          }
        })
        .catch(err => console.error("Error fetching tecnico info:", err));
    }
  }, [codTecnico, tecnicoArea]);

  useEffect(() => {
    if (mainplant === null && !codTecnico) {
      navigate("/hub");
    }
  }, [mainplant, navigate, codTecnico]);

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

  // States for Technician Mode Range
  const [fechaInicioInput, setFechaInicioInput] = useState(initialFecha);
  const [fechaFinInput, setFechaFinInput] = useState(initialFecha);
  const [fechaInicioAplicada, setFechaInicioAplicada] = useState(initialFecha);
  const [fechaFinAplicada, setFechaFinAplicada] = useState(initialFecha);

  const [paginaActual, setPaginaActual] = useState(1);
  const TECNICOS_POR_PAGINA = 20;

  // Seleccionamos el hook según si estamos en modo técnico o no
  const hookRanking = useRankingData(fechaConsultaAplicada, codTecnico ? null : mainplant, "125");
  const hookTecnico = useTecnicoRankingData(
    fechaInicioAplicada,
    fechaFinAplicada,
    codTecnico || "",
    codTecnico ? mainplant : null
  );

  const {
    tecnicos,
    setTecnicos,
    tareasPorTecnico,
    jornadaPorTecnico,
    cargando,
    dataLoaded,
    errorMsg,
  } = codTecnico ? hookTecnico : hookRanking;

  const tecnicosOrdenados = useMemo(() => {
    return [...tecnicos].sort((a, b) => {
      const tareasA = tareasPorTecnico[a.codigo] || [];
      const minA = tareasA.reduce((acc, t) => acc + getDuracionTarea(t.FECHA_INI, t.FECHA_FIN, t.DELEGACION || a.delegacion), 0);

      const tareasB = tareasPorTecnico[b.codigo] || [];
      const minB = tareasB.reduce((acc, t) => acc + getDuracionTarea(t.FECHA_INI, t.FECHA_FIN, t.DELEGACION || b.delegacion), 0);

      return minB - minA;
    });
  }, [tecnicos, tareasPorTecnico]);

  useEffect(() => {
    setPaginaActual(1);
  }, [tecnicos]);

  const maxPaginas = Math.ceil(tecnicosOrdenados.length / TECNICOS_POR_PAGINA);
  const handleNextPage = () => {
    setPaginaActual((prev) => (prev >= maxPaginas ? 1 : prev + 1));
  };

  const tecnicosPaginados = useMemo(() => {
    if (codTecnico) return tecnicosOrdenados; // No paginamos en vista individual
    return tecnicosOrdenados.slice(
      (paginaActual - 1) * TECNICOS_POR_PAGINA,
      paginaActual * TECNICOS_POR_PAGINA
    );
  }, [tecnicosOrdenados, paginaActual, codTecnico]);

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

    let leftPos = e.clientX + 15;
    let topPos = e.clientY + 15;

    if (leftPos + hoverDiv.offsetWidth > window.innerWidth) {
      leftPos = e.clientX - hoverDiv.offsetWidth - 15;
    }
    if (topPos + hoverDiv.offsetHeight > window.innerHeight) {
      topPos = e.clientY - hoverDiv.offsetHeight - 15;
    }

    hoverDiv.style.left = `${leftPos}px`;
    hoverDiv.style.top = `${topPos}px`;
  };

  const handleMouseLeave = () => {
    const hoverDiv = document.getElementById("divHoverRanking");
    if (hoverDiv) hoverDiv.style.display = "none";
  };

  const regionName = useMemo(() => obtenerNombreRegion(regionParam), [regionParam]);
  const areaName = useMemo(() => {
    if (codTecnico) return ""; // En modo técnico ya se muestra su nombre
    if (!mainplant) return "";
    const firstCode = mainplant.split("-")[0];
    return obtenerNombreIsla(firstCode);
  }, [mainplant, codTecnico]);

  if (!mainplant && (!codTecnico || (codTecnico && tecnicoArea))) {
    return null;
  }

  return (
    <div id="productividad-tecnicos-page" className={codTecnico ? "tecnico-view-only" : ""}>
      <div className="productividad-header">
        <div className="productividad-title-container">
          <h1 className="productividad-title">
            {codTecnico ? `Detalle Técnico: ${codTecnico}` : `${areaName} - ${regionName}`}
            {maxPaginas > 1 && (
              <div id="pageNumber" style={{ fontSize: '0.6em', opacity: 0.8, marginTop: '2px' }}>Página {paginaActual}</div>
            )}
          </h1>
        </div>

        {!codTecnico && (
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
              <button id="botonProductividad" onClick={() => navigate("/estadisticas-productividad")}>
                Estadísticas
              </button>
              {maxPaginas > 1 && (
                <button id="btnNextPage" onClick={handleNextPage}>
                  Siguiente página
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="filtros-container">
        {codTecnico && (
          <div className="tecnico-range-picker">
            <div className="range-row">
              <label>Fecha de Inicio:</label>
              <input
                type="date"
                value={fechaInicioInput}
                disabled={cargando}
                onChange={(e) => setFechaInicioInput(e.target.value)}
              />
            </div>
            <div className="range-row">
              <label>Fecha de Fin:</label>
              <input
                type="date"
                value={fechaFinInput}
                disabled={cargando}
                onChange={(e) => setFechaFinInput(e.target.value)}
              />
            </div>
            <button
              className="consultar-btn"
              disabled={cargando}
              onClick={() => {
                setFechaInicioAplicada(fechaInicioInput);
                setFechaFinAplicada(fechaFinInput);
              }}
            >
              Consultar fechas
            </button>
          </div>
        )}
      </div>

      {cargando && <Loader />}

      <ErrorMessage
        message={!cargando && errorMsg && dismissedError !== errorMsg ? errorMsg : ""}
        onClear={() => setDismissedError(errorMsg)}
      />

      {dataLoaded && (
        <div id="tablaTecnicos" className="tablaGrande">
          {tecnicosPaginados.map((tec) => (
            <LineaTiempoTecnico
              key={tec.codigo}
              tec={tec}
              tareas={tareasPorTecnico[tec.codigo] || []}
              jornada={jornadaPorTecnico[tec.codigo] || null}
              handleMouseEnter={handleMouseEnter}
              handleMouseMove={handleMouseMove}
              handleMouseLeave={handleMouseLeave}
              copiarAPortapapeles={copiarAPortapapeles}
            />
          ))}
        </div>
      )}

      <div id="divHoverRanking" className="divHover" />
      {notificacion && <div className="notificacion-ranking mostrar">{notificacion}</div>}
    </div>
  );
}
  