// src/webs/Averias/TecnicoCard.tsx
// Equivalente a createTable() de averias.js


import { useState } from "react";
import type { Tecnico, Averia } from "../../services/Types";
import { getClaseFamilia } from "../../config/regionConfig";
import { construirHover, copyToClipboard } from "./datosAviso";
import { getSLAColor } from "../../services/commonLogic";
import AveriaDetailModal from "./AveriaDetailModal";
import HoverTooltip from "../common/HoverTooltip";

// -- Removiendo Helpers locales de color SLA --


// ─── Componente AveriaRow ──────────────────────────────────────────────────

interface AveriaRowProps {
  averia: Averia;
}

function AveriaRow({ averia }: AveriaRowProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const colorClass = getSLAColor(averia.delta_origen, averia.userstatus, averia.codeactivity ?? undefined);
  const [textFamilia, claseFamilia] = getClaseFamilia(
    averia.familia,
    averia.tipo_aviso,
  );
  const esRepetitiva = averia.recurrente;

  const sla = parseFloat(averia.delta_origen) || 0;
  const isAmarillo = colorClass === "amarillo" || colorClass === "moradoamarillo";

  const linkColor =
    sla <= -16
      ? isAmarillo
        ? "black"
        : "yellow"
      : isAmarillo
        ? "black"
        : "white";

  // Borde para averías repetitivas
  let highlightingClass = "";
  if (esRepetitiva) {
    highlightingClass = "highlight-row";
  }

  const hoverText = construirHover(averia);

  const handleClick = () => {
    if (window.innerWidth <= 900) {
      setIsModalOpen(true);
    } else {
      copyToClipboard(averia.codigo);
    }
  };

  const tooltipContent = (
    <div style={{ whiteSpace: "pre-wrap" }}>
      {hoverText}
    </div>
  );

  return (
    <>
      <HoverTooltip content={tooltipContent} positionMode="fixed">
        <div
          className={`averia-card-row ${highlightingClass}`}
          onClick={handleClick}
        >
          <div className={`familia-tag ${claseFamilia}`}>
            {textFamilia}
          </div>
          <div className={`averia-content ${colorClass}`}>
            <a
              href="#"
              className={esRepetitiva ? "parpadea" : ""}
              style={{ color: linkColor }}
              onClick={(e) => e.preventDefault()}
            >
              {averia.cliente}
            </a>
          </div>
        </div>
      </HoverTooltip>

      <AveriaDetailModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        averia={averia} 
      />
    </>
  );
}

// ─── Componente TecnicoCard ────────────────────────────────────────────────

interface TecnicoCardProps {
  tecnico: Tecnico;
  averias: Averia[];
}

function TecnicoCard({ tecnico, averias }: TecnicoCardProps) {
  const averiasDelTecnico = averias.filter((a) => {
    const codeA = a.cod_tec ? String(a.cod_tec).trim() : null;
    const codeT = tecnico.codigo ? String(tecnico.codigo).trim() : null;

    if (codeT && codeA && codeT === codeA) {
      return true;
    }

    if (!codeA && (tecnico.nombre?.trim() ?? "") === (a.nombre_zona?.trim() ?? "")) {
      return true;
    }

    return false;
  });

  if (averiasDelTecnico.length === 0) return null;

  const imgSrc =
    tecnico.fototec !== null && tecnico.fototec.trim() !== ""
      ? `data:image/png;base64,${tecnico.fototec}`
      : "/img/tecnico.jpg";

  return (
    <div className="tecnico-card">
      <div className="tecnico-header">
        <img src={imgSrc} className="tecnico-avatar" alt={tecnico.nombre} />
        <div className="tecnico-nombre">
          {tecnico.codigo && !tecnico.nombre.includes(String(tecnico.codigo)) ? `${tecnico.codigo} ` : ""}
          {tecnico.nombre}
        </div>
      </div>
      <div className="tecnico-averias-list">
        {averiasDelTecnico.map((averia, idx) => (
          <AveriaRow key={`${averia.codigo}-${idx}`} averia={averia} />
        ))}
      </div>
    </div>
  );
}

// ─── Componente Grid principal ─────────────────────────────────────────────

interface TablaTecnicosProps {
  tecnicos: Tecnico[];
  averias: Averia[];
}

export default function TablaTecnicos({
  tecnicos,
  averias,
}: TablaTecnicosProps) {
  return (
    <div className="tecnicos-grid" id="tablaTecnicos">
      {tecnicos.map((tec) => (
        <TecnicoCard
          key={tec.codigo ?? tec.nombre}
          tecnico={tec}
          averias={averias}
        />
      ))}
    </div>
  );
}
  