import { getClaseFamilia } from "../../config/regionConfig";
import HoverTooltip from "../common/HoverTooltip";
//* import { getSLAColor } from "../../services/commonLogic";

export default function TrabajoClienteCard({ averia, count }: { averia: any, count?: number }) {
  const [sigla, claseFamilia] = getClaseFamilia(
    averia.FAMILIA,
    averia.TIPO_AVISO,
  );
  // TODO: Implementar en un futuro el color de fila segun "DIFERENCIA", campo de la peticion 60
  //* const colorRow = getSLAColor(averia.SLA ?? averia.DIFERENCIA ?? 10, averia.USERSTATUS, averia.CODEACTIVITY ?? undefined);
  const colorRow = "verde";

  let cliente = averia.CLIENTE || "";
  const displayCliente = count ? `${cliente} (${count})` : cliente;

  const hoverContent = (
    <div className="tooltip-inner">
      <div className="tooltip-title">{averia.AVISO || "Sin Aviso"}</div>
      <hr className="tooltip-divider" />
      <div className="tooltip-body">
        <div className="tooltip-record">
          {averia.FECHA_AVISO && <div className="tooltip-date">· {averia.FECHA_AVISO}</div>}
          <div className="tooltip-desc" style={{ marginTop: '5px' }}>{displayCliente}</div>
          {averia.POBLACION && <div className="tooltip-intervention"><div className="tooltip-tech">Población: {averia.POBLACION}</div></div>}
          {averia.SINTOMA && <div className="tooltip-intervention"><div className="tooltip-tech">Síntoma: {averia.SINTOMA}</div></div>}
          {averia.ESTADO && <div className="tooltip-intervention"><div className="tooltip-tech">Estado: {averia.ESTADO}</div></div>}
        </div>
      </div>
    </div>
  );

  return (
    <HoverTooltip content={hoverContent}>
      <div className={`trabajo-cliente-row ${colorRow}`}>
        <div className={`trabajo-cliente-tag ${claseFamilia}`}>{sigla}</div>
        <div className="trabajo-cliente-content">{displayCliente}</div>
      </div>
    </HoverTooltip>
  );
}
  