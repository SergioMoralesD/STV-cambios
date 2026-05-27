import { useMemo, useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { getDuracionTarea, getFechaHoraZona } from "../../utils/timeUtils";
import {
  construirHover,
  getCalcularPosicion,
  getColorPorDuracion,
  getColorTipoTarea,
  getEtiquetaTarea,
  type JornadaData,
  type TecData,
  type TareaData,
} from "../../utils/rankingHelpers";

interface LineaTiempoTecnicoProps {
  tec: TecData;
  tareas: TareaData[];
  jornada: JornadaData | null;
  handleMouseEnter: (content: string) => void;
  handleMouseMove: (e: MouseEvent) => void;
  handleMouseLeave: () => void;
  copiarAPortapapeles: (texto: string) => void;
  fixedRange?: [number, number];
  layout?: "row" | "column";
  hideInfo?: boolean;
}

// Eliminado horasLabels hardcoded
const UMBRAL_AGRUPACION = 2.5;
const SEPARACION_EXPANDIDA = 2.0;

function getMinutosDelDia(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function clampPos(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export default function LineaTiempoTecnico({
  tec,
  tareas,
  jornada,
  handleMouseEnter,
  handleMouseMove,
  handleMouseLeave,
  copiarAPortapapeles,
  fixedRange,
  layout = "row",
  hideInfo = false,
}: LineaTiempoTecnicoProps) {
  if (tec.mostrar === false) return null;

  const [clusterExpandido, setClusterExpandido] = useState<string | null>(null);

  const minutosTotales = tareas.reduce((acc, t) => {
    return acc + getDuracionTarea(t.FECHA_INI, t.FECHA_FIN, t.DELEGACION || tec.delegacion);
  }, 0);

  // --- CÁLCULO DINÁMICO DE RANGOS ---
  const getInicioHorario = () => {
    if (fixedRange) return fixedRange[0];
    let minStart = 24;
    if (jornada?.inicio) {
      minStart = jornada.inicio.getHours();
    }
    if (tareas.length > 0) {
      tareas.forEach(t => {
        if (t.FECHA_INI) {
          const hour = new Date(t.FECHA_INI).getHours();
          if (hour < minStart) minStart = hour;
        }
      });
    }
    return minStart < 24 ? minStart : 6;
  };

  const getFinHorario = (inicio: number) => {
    if (fixedRange) return fixedRange[1];
    let maxFin = inicio + 8;
    if (tareas.length > 0) {
      tareas.forEach((t) => {
        if (t.FECHA_FIN && !t.FECHA_FIN.includes("1900-01-01")) {
          const finHour = new Date(t.FECHA_FIN).getHours();
          if (finHour > maxFin) maxFin = finHour + 1;
        }
      });
    }
    return Math.max(14, maxFin);
  };

  const inicioHorario = getInicioHorario();
  const finHorario = getFinHorario(inicioHorario);
  const inicioMinutos = inicioHorario * 60;
  const finMinutos = finHorario * 60;
  
  // Rango de horas incluyendo la última
  const rangoHorasLabels = Array.from({ length: finHorario - inicioHorario + 1 }, (_, i) => inicioHorario + i);

  // 1. Clasificación y Etiquetas
  const agrupacionesBanderas = useMemo(() => {
    const banderas = [] as Array<{
      id: string;
      posicion: number;
      etiqueta: string;
      clase: string;
      hover: string;
      baseZ: number;
      miefChia?: string;
    }>;

    // Eliminadas las banderas de inicio/fin de jornada a petición del usuario.
    // Solo se mostrarán las marcas verticales en la barra gráfica.

    tareas.forEach((tarea, idx) => {
      const fechaInicio = new Date(tarea.FECHA_INI);
      if (Number.isNaN(fechaInicio.getTime())) return;
      
      const duracion = getDuracionTarea(tarea.FECHA_INI, tarea.FECHA_FIN, tarea.DELEGACION || tec.delegacion);
      const etiqueta = getEtiquetaTarea(tarea);
      const claseColor = getColorTipoTarea(tarea);

      // Color para las banderas: si la duración está fuera de plazo, usar noPlazo; si no, usar el color del tipo
      const colorTiempo = getColorPorDuracion(duracion, tarea.TAREA || "");
      const claseBandera = colorTiempo || claseColor;

      const priorityZ = Math.max(10, 500 - Math.floor(duracion));

      banderas.push({
        id: `tarea-${tec.codigo}-${idx}`,
        posicion: getCalcularPosicion(getMinutosDelDia(fechaInicio), inicioMinutos, finMinutos),
        etiqueta: etiqueta,
        clase: claseBandera,
        hover: construirHover(tarea),
        baseZ: priorityZ,
        miefChia: tarea.MIEF_CHIA,
      });
    });

    const ordenadas = banderas.sort((a, b) => a.posicion - b.posicion);
    const clusters: Array<{ id: string; centro: number; items: typeof ordenadas }> = [];

    for (const bandera of ordenadas) {
      const ultimoCluster = clusters[clusters.length - 1];
      if (ultimoCluster && Math.abs(bandera.posicion - ultimoCluster.centro) < UMBRAL_AGRUPACION) {
        ultimoCluster.items.push(bandera);
        ultimoCluster.centro = ultimoCluster.items.reduce((sum, item) => sum + item.posicion, 0) / ultimoCluster.items.length;
      } else {
        clusters.push({ id: `cluster-${bandera.id}`, centro: bandera.posicion, items: [bandera] });
      }
    }
    return clusters;
  }, [tareas, tec.codigo, tec.delegacion]);

  // 2. Ordenación de barras de tiempo (Cortas encima de largas)
  const tareasOrdenadasParaBarras = useMemo(() => {
    return [...tareas].sort((a, b) => {
      const durA = getDuracionTarea(a.FECHA_INI, a.FECHA_FIN, a.DELEGACION || tec.delegacion);
      const durB = getDuracionTarea(b.FECHA_INI, b.FECHA_FIN, b.DELEGACION || tec.delegacion);
      return durB - durA; // Mayor duración primero (abajo)
    });
  }, [tareas, tec.delegacion]);

  return (
    <div className={`tecnico-box tecnico ${layout === "column" ? "layout-column" : "layout-row"}`}>
      {!hideInfo && (
        <Link 
          to={`/RegistroTecnico/${tec.codigo}?nombre=${encodeURIComponent(tec.nombre)}`} 
          className="datos-tecnico info-container"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none' }}
        >
          <p className="nomTecnico">
            {tec.codigo} - {tec.nombre}
          </p>
          <p className="minTecnico">({Math.floor(minutosTotales)} min)</p>
        </Link>
      )}

      <div className="contenedor-horario timeline-horizontal">
        <div className="banderas flags-container">
          {agrupacionesBanderas.map((cluster) => {
            if (cluster.items.length === 1) {
              const item = cluster.items[0];
              return (
                <div
                  key={item.id}
                  className={`bandera-cuadrada ${item.clase}`}
                  style={{ left: `${item.posicion}%`, zIndex: item.baseZ }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.miefChia) copiarAPortapapeles(item.miefChia);
                  }}
                  onMouseEnter={() => handleMouseEnter(item.hover)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  {item.etiqueta}
                </div>
              );
            }

            const expandido = clusterExpandido === cluster.id;
            if (!expandido) {
              return (
                <div
                  key={cluster.id}
                  className="bandera-cuadrada bandera-agrupada"
                  style={{
                    left: `${cluster.centro}%`,
                    zIndex: 260,
                    background: "linear-gradient(180deg, #3a3a3a 0%, #1f1f1f 100%)",
                    color: "#fff",
                    border: "1px solid rgba(255, 255, 255, 0.85)",
                    minWidth: "30px",
                  }}
                  onClick={() => setClusterExpandido(cluster.id)}
                  onMouseEnter={() => handleMouseEnter(`Banderas agrupadas (${cluster.items.length})`)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  +{cluster.items.length}
                </div>
              );
            }

            return cluster.items.map((item, idx) => {
              const offset = (idx - (cluster.items.length - 1) / 2) * SEPARACION_EXPANDIDA;
              return (
                <div
                  key={`${cluster.id}-${item.id}`}
                  className={`bandera-cuadrada ${item.clase} bandera-expandida`}
                  style={{
                    left: `${clampPos(cluster.centro + offset)}%`,
                    zIndex: 280 + idx,
                    outline: "1.5px solid rgba(255, 255, 255, 0.95)",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setClusterExpandido(null);
                    if (item.miefChia) copiarAPortapapeles(item.miefChia);
                  }}
                  onMouseEnter={() => handleMouseEnter(item.hover)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  {item.etiqueta}
                </div>
              );
            });
          })}
        </div>

        <div className="barra-grafica timeline-container">
          {tareasOrdenadasParaBarras.map((tarea, idx) => {
            const fechaInicio = new Date(tarea.FECHA_INI);
            if (Number.isNaN(fechaInicio.getTime())) return null;

            let fechaFin = getFechaHoraZona(tarea.FECHA_FIN, tarea.DELEGACION || tec.delegacion);
            if (Number.isNaN(fechaFin.getTime())) {
              const ahora = new Date();
              if (fechaInicio.toDateString() === ahora.toDateString()) {
                fechaFin = ahora;
              } else {
                fechaFin = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), fechaInicio.getDate(), 23, 59, 59);
              }
            }

            const inicioMins = getMinutosDelDia(fechaInicio);
            const finMins = getMinutosDelDia(fechaFin);
            const pIzq = getCalcularPosicion(inicioMins, inicioMinutos, finMinutos);
            const pDer = getCalcularPosicion(finMins, inicioMinutos, finMinutos);
            const width = Math.max(0.35, pDer - pIzq);

            if (width > 100 || pIzq < -50 || pIzq > 150) return null;

            const claseColor = getColorTipoTarea(tarea);

            return (
              <div
                key={`tarea-${idx}`}
                className={`tarea ${claseColor}`}
                style={{ left: `${pIzq}%`, width: `${width}%`, zIndex: 10 + idx }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (tarea.MIEF_CHIA) copiarAPortapapeles(tarea.MIEF_CHIA);
                }}
                onMouseEnter={() => handleMouseEnter(construirHover(tarea))}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              />
            );
          })}

          {/* Marcadores de inicio y fin de jornada (Púrpura) */}
          {jornada?.inicio && (
            <div
              className="diaInicioFin"
              style={{ left: `${getCalcularPosicion(getMinutosDelDia(jornada.inicio), inicioMinutos, finMinutos)}%` }}
              onMouseEnter={() => handleMouseEnter(`Inicio de jornada: ${jornada.inicio?.toLocaleTimeString()}`)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
          )}
          {jornada?.fin && (
            <div
              className="diaInicioFin"
              style={{ left: `${getCalcularPosicion(getMinutosDelDia(jornada.fin), inicioMinutos, finMinutos)}%` }}
              onMouseEnter={() => handleMouseEnter(`Fin de jornada: ${jornada.fin?.toLocaleTimeString()}`)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
          )}
        </div>

        <div className="horas-trabajo horas-container">
          {rangoHorasLabels.map((h, idx) => {
            const pos = ((h - inicioHorario) / (finHorario - inicioHorario)) * 100;
            return (
              <span 
                key={`hora-${h}`}
                style={{
                  position: 'absolute',
                  left: `${pos}%`,
                  transform: idx === 0 ? 'none' : (pos > 98 ? 'translateX(-100%)' : 'translateX(-50%)')
                }}
              >
                {h}:00
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
  