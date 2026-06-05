import type { MaquinaRetirada, Mainplant } from "../../services/Types";
import { IslaCard, type HeaderColumn } from "../common/IslaCard";
import FilaEquipo from "./FilaEquipo";

interface Props {
  isla: Mainplant;
  datos: MaquinaRetirada[];
  totalIslas: number;
  onMouseEnter: (e: React.MouseEvent, text: string) => void;
  onMouseLeave: () => void;
}

const HEADERS: HeaderColumn[] = [
  { label: "Fam", className: "Machine" },
  { label: "Matrícula", className: "matricula" },
  { label: "Fecha Retirada", className: "fecha" },
];

export default function IslaTable({
  isla,
  datos,
  totalIslas,
  onMouseEnter,
  onMouseLeave,
}: Props) {
  const filasFD = datos.filter(
    (r) => r.redisposiciones_text !== "Sin redisposiciones",
  );
  const filasNoFD = datos.filter(
    (r) => r.redisposiciones_text === "Sin redisposiciones",
  );

  return (
    <IslaCard
      isla={isla}
      totalIslas={totalIslas}
      headers={HEADERS}
      headerFlexDirection="row"
      data={datos}

      groups={[
        { id: "fd", items: filasFD, className: "FD" },
        { id: "nofd", items: filasNoFD, className: "NoFD" },
      ]}
      renderRow={(row, i) => (
        <FilaEquipo
          key={`${row.matricula}-${i}`}
          row={row}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        />
      )}
    />
  );
}
  