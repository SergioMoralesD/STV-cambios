import type { FAEquipo, Mainplant } from "../../services/Types";
import { IslaCard, type HeaderColumn } from "../common/IslaCard";
import { FilaEquipo } from "./FilaEquipo";

interface Props {
  isla: Mainplant;
  datos: FAEquipo[];
  totalIslas: number;
  onMouseEnter: (e: React.MouseEvent, text: string) => void;
  onMouseLeave: () => void;
}

const HEADERS: HeaderColumn[] = [
  { label: "Fam", className: "Machine" },
  { label: "Matrícula", className: "matricula" },
  { label: "Modelo", className: "modelo" },
  { label: "Fecha Instalación", className: "fecha" },
];

export function IslaTable({
  isla,
  datos,
  totalIslas,
  onMouseEnter,
  onMouseLeave,
}: Props) {
  return (
    <IslaCard
      isla={isla}
      totalIslas={totalIslas}
      headers={HEADERS}
      headerFlexDirection="row"
      data={datos}

      containerClassName="fa-col"
      groups={[{ id: "Averia", items: datos, className: "Averia" }]}
      renderRow={(row, i) => (
        <FilaEquipo
          key={i}
          row={row}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        />
      )}
    />
  );
}
  