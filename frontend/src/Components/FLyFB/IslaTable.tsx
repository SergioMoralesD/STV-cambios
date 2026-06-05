import React from 'react';
import { IslaCard } from '../common/IslaCard';
import type { FlyFBItem } from '../../services/flyfbService';
import { getEnhancedFamily } from '../../services/commonLogic';
import { obtenerNombreIsla } from '../../config/regionConfig';

interface Props {
  isla: { mainplant: string; is: string };
  datos: FlyFBItem[];
  totalIslas: number;
  clientCounts: Record<string, number>;
}

export const IslaTable: React.FC<Props> = ({ isla, datos, totalIslas, clientCounts }) => {
  return (
    <IslaCard
      isla={isla as any}
      totalIslas={totalIslas}
      layout="custom"
      containerClassName="flyfb-col"
      cardClassName="flyfb-island-card"
      headerClassName="flyfb-island-header"
      bodyClassName="flyfb-island-body"
      customHeaderContent={
        <>
          <img className="flyfb-island-logo" src={`/img/${isla.is}.png`} alt={isla.mainplant} />
          <span className="flyfb-island-title">
            {obtenerNombreIsla(isla.mainplant)} ({datos.length})
          </span>
        </>
      }
      data={datos}
      renderRow={(item, idx) => {
        const [sigla, claseFamilia] = getEnhancedFamily(item.familiaRaw || "", item.tipoAvisoRaw || "");
        return (
          <div key={`${item.codigo}-${idx}`} className={`flyfb-row-card`}>
            <div className={`flyfb-row-family ${claseFamilia}`}>
              {sigla || '—'}
            </div>
            <div className="flyfb-row-main">
              <div className="flyfb-cell flyfb-cell-type">{item.tipoLabel}</div>
              <div className="flyfb-cell flyfb-cell-code" title={item.avisoLabel}>{item.avisoLabel.slice(3)}</div>
              {/* <div className="flyfb-cell flyfb-cell-count">{item.counterLabel}</div> */}
              <div className="flyfb-cell flyfb-cell-status" title={item.estadoLabel}>{item.estadoLabel || '—'}</div>
              <div className="flyfb-cell flyfb-cell-client" title={item.clienteLabel}>
                {item.clienteLabel}
                {clientCounts[item.clienteLabel] > 0 && (
                  <span className="flyfb-client-badge"> ({clientCounts[item.clienteLabel]})</span>
                )}
              </div>
            </div>
          </div>
        );
      }}
    >
      {datos.length === 0 && (
        <div className="flyfb-empty">Sin avisos en curso</div>
      )}
    </IslaCard>
  );
};
  