import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  getRowColor,
  construirHover,
  getClaseFamilia,
  getDelegInfo,
} from "./utils";
import type { AveriaCompleta as MachineData } from "../../services/averiaService";
import { IslaCard } from "../common/IslaCard";
import type { IslaColumna } from "../../config/regionConfig";

interface AveriasRepetitivasTextoProps {
  islas: IslaColumna[];
  dataSemana: MachineData[];
  dataAno: MachineData[];
  error: string | null;
  onCloseError: () => void;
  onBack: () => void;
}

interface TooltipState {
  content: React.ReactNode;
  x: number;
  y: number;
}

export default function AveriasRepetitivasTexto({
  islas,
  dataSemana,
  dataAno,
  error,
  onCloseError,
  onBack,
}: AveriasRepetitivasTextoProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = (e: React.MouseEvent, item: MachineData) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const x = e.clientX;
    const y = e.clientY;
    setTooltip({ content: construirHover(item), x, y });
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setTooltip(null);
    }, 100); // Pequeño retraso para permitir mover el ratón al tooltip
  };

  const handleTooltipMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleTooltipMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div className="container-fluid avRepetitivas-container">
      {/* Error */}
      {error && (
        <div className="error" style={{ display: "flex" }}>
          <span id="errorText">{error}</span>
          <span className="cruzError" onClick={onCloseError}>
            X
          </span>
        </div>
      )}

      {/* SECCIÓN ÚLTIMA SEMANA */}
      <div className="section-wrapper">
        <div className="section-header">ÚLTIMA SEMANA</div>
        <div className="av-row" id="dataRowSemana">
          {islas.map((isla) => {
            const islaCodes = isla.mainplant.toUpperCase().split("-");
            const filteredData = dataSemana.filter((d) => {
              const itemFili = (d.fili || d.DELEGACION || "").toString().toUpperCase();
              return itemFili && islaCodes.includes(itemFili);
            });

            const isGrouped = isla.id === "6S25-6S21_MENORES";

            return (
              <IslaCard
                key={`${isla.id}-semana`}
                data={filteredData}
                containerClassName="av-col"
                layout="custom"
                bodyClassName="av-card-body"
                totalIslas={islas.length}
                headerClassName="sticky-header"
                customHeaderContent={
                  <div className="thead-container">
                    <div className="Machine header-spacer"></div>
                    <div className="thead-left">
                      {isGrouped ? (
                        <>
                          <img className="islas" src="/img/fv.png" alt="fv" />
                          <img className="islas" src="/img/im.png" alt="im" />
                        </>
                      ) : (
                        <img
                          className="islas"
                          src={`/img/${isla.img}.png`}
                          alt="isla"
                        />
                      )}
                      <span>{isla.label}</span>
                    </div>
                    <div className="thead-right-col">w</div>
                    <div className="thead-right-col">m</div>
                    <div className="thead-right-col">y</div>
                  </div>
                }
                renderRow={(item, idx) => {
                  const { colorClass, textColor } = getRowColor(item.cuenta30);
                  const [familiaText, familiaClass] = getClaseFamilia(
                    item.machine_familia,
                    "",
                  );
                  const weekColorClass = item.cuenta7 > 2 ? "text-red" : "";

                  return (
                    <div key={idx} className={`av-row-custom ${colorClass}`}>
                      <div className={`Machine ${familiaClass}`}>
                        {familiaText}
                      </div>
                      <div
                        className="main-info-cell"
                        style={{ color: textColor, cursor: "pointer" }}
                        onMouseEnter={(e) => handleMouseEnter(e, item)}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="matricula-text">
                          {item.matricula_original || item.matricula}
                        </div>
                        <div className="cliente-text">
                          {item.cliente_actual || "RETIRADO"}
                        </div>

                      </div>
                      <div
                        className={`count-cell ${weekColorClass}`}
                        style={{ color: weekColorClass ? "" : textColor }}
                      >
                        {item.cuenta7}
                      </div>
                      <div
                        className="count-cell"
                        style={{ color: textColor }}
                      >
                        {item.cuenta30}
                      </div>
                      <div
                        className="count-cell"
                        style={{ color: textColor }}
                      >
                        {item.cuenta365}
                      </div>
                    </div>
                  );
                }}
              />
            );
          })}
        </div>
      </div>

      {/* SECCIÓN ÚLTIMO AÑO */}
      <div className="section-wrapper">
        <div className="section-header">ÚLTIMO AÑO</div>
        <div className="av-row" id="dataRowAno">
          {islas.map((isla) => {
            const islaCodes = isla.mainplant.toUpperCase().split("-");
            const filteredData = dataAno.filter((d) => {
              const itemFili = (d.fili || d.DELEGACION || "").toString().toUpperCase();
              return itemFili && islaCodes.includes(itemFili);
            }).sort((a, b) => (Number(b.cuenta365) || 0) - (Number(a.cuenta365) || 0));

            const isGrouped = isla.id === "6S25-6S21_MENORES";
            // No ocultar si no hay datos para mantener la consistencia de 5 columnas


            return (
              <IslaCard
                key={`${isla.id}-ano`}
                data={filteredData}
                containerClassName="av-col"
                layout="custom"
                bodyClassName="av-card-body"
                totalIslas={islas.length}
                headerClassName="sticky-header"
                headerStyle={{ display: "none" }}


                customHeaderContent={
                  <div className="thead-container">
                    <div className="Machine header-spacer"></div>
                    <div className="thead-left">
                      {isGrouped ? (
                        <>
                          <img className="islas" src="/img/fv.png" alt="fv" />
                          <img className="islas" src="/img/im.png" alt="im" />
                        </>
                      ) : (
                        <img
                          className="islas"
                          src={`/img/${isla.img}.png`}
                          alt="isla"
                        />
                      )}
                      <span>{isla.label}</span>
                    </div>
                    <div className="thead-right-col">w</div>
                    <div className="thead-right-col">m</div>
                    <div className="thead-right-col">y</div>
                  </div>
                }
                renderRow={(item, idx) => {
                  const { colorClass, textColor } = getRowColor(item.cuenta30);
                  const [familiaText, familiaClass] = getClaseFamilia(
                    item.machine_familia,
                    "",
                  );
                  const weekColorClass = item.cuenta7 > 2 ? "text-red" : "";

                  return (
                    <div key={idx} className={`av-row-custom ${colorClass}`}>
                      <div className={`Machine ${familiaClass}`}>
                        {familiaText}
                      </div>
                      <div
                        className="main-info-cell"
                        style={{ color: textColor, cursor: "pointer" }}
                        onMouseEnter={(e) => handleMouseEnter(e, item)}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="matricula-text">
                          {item.matricula_original || item.matricula}
                        </div>
                        <div className="cliente-text">
                          {item.cliente_actual || "RETIRADO"}
                        </div>

                      </div>
                      <div
                        className={`count-cell ${weekColorClass}`}
                        style={{ color: weekColorClass ? "" : textColor }}
                      >
                        {item.cuenta7}
                      </div>
                      <div
                        className="count-cell"
                        style={{ color: textColor }}
                      >
                        {item.cuenta30}
                      </div>
                      <div
                        className="count-cell"
                        style={{ color: textColor }}
                      >
                        {item.cuenta365}
                      </div>
                    </div>
                  );
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Tooltip global portal */}
      {tooltip &&
        createPortal(
          <div
            className="custom-tooltip"
            style={{
              top: tooltip.y + 12,
              left: Math.min(tooltip.x + 12, window.innerWidth - 420),
            }}
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
          >
            {tooltip.content}
          </div>,
          document.body,
        )}
    </div>
  );
}
  