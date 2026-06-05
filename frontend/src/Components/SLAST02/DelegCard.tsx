import { useState, useRef } from "react";
import type { SlaSt02Row } from "../../services/Types";
import { IslaCard } from "../common/IslaCard";
import { buildContadores, getSlaClass, getRedisposicionClass } from "./helpers";
import { RowItem } from "./RowItem";
import type { TooltipHandlers } from "./types";
import { DELEG_ABREV, DELEG_NAME } from "./constants";

interface DelegCardProps {
  deleg: string;
  rows: SlaSt02Row[];
  isCanarias: boolean;
  tooltipHandlers: TooltipHandlers;
}

export function DelegCard({
  deleg,
  rows,
  isCanarias,
  tooltipHandlers,
}: DelegCardProps) {
  const [scrolledDown, setScrolledDown] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredRows = rows.filter((r) => r.DELEGACION === deleg);
  const contadores = buildContadores(filteredRows);

  const handleScroll = () => {
    if (!listRef.current) return;
    if (!scrolledDown) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
      setScrolledDown(true);
    } else {
      listRef.current.scrollTop = 0;
      setScrolledDown(false);
    }
  };

  const abrev = DELEG_ABREV[deleg] ?? "tf";
  const name = DELEG_NAME[deleg] ?? deleg;

  return (
    <IslaCard
      layout="custom"
      isla={{ mainplant: name, is: abrev }}
      containerClassName="sla-deleg-col"
      regionClass={isCanarias ? "sla-col-canarias" : "sla-col-baleares"}
      cardClassName="sla-card-container"
      headerClassName="isla-card-header-flex sla-card-header"
      bodyClassName="sla-list-body"
      bodyRef={listRef}
      extraHeader={
        <>
          <span className="sla-header-counter">
            ({contadores.EQ} eq; {contadores.CA.total} cab)
          </span>
        </>
      }
    >
      {filteredRows.length > 0 ? (
        filteredRows.map((row, i) => (
          <RowItem
            key={`${row.MATRICULA}-${i}`}
            row={row}
            {...tooltipHandlers}
            colorClass={getSlaClass(row.SLA)}
            redisposicionClass={getRedisposicionClass(row.ESTADO_SOLICITUD_REDISPOSICION)}
          />
        ))
      ) : (
        <div className="sla-no-data">No se encontraron datos</div>
      )}
    </IslaCard>
  );
}

  