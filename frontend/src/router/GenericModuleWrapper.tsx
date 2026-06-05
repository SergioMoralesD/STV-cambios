/**
 * GenericModuleWrapper.tsx
 *
 * Wrapper genérico que reemplaza todos los XxxWrapper de App.tsx.
 * Calcula región, delegaciones permitidas y mps a partir del contexto,
 * e inyecta las props correctas al componente según su `propsMode`.
 */

import { useMemo } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useSelection } from '../Context/SelectionContext';
import {
  obtenerDelegacionesVista,
  obtenerRegionActual,
  resolverMainplant,
} from '../config/regionConfig';
import type { ModuleConfig } from './moduleRegistry';

export default function GenericModuleWrapper({
  Component,
  propsMode,
  delegacionesVista,
}: ModuleConfig) {
  const { user } = useAuth();
  const { selectedRegion, selectedDelegations } = useSelection();

  const regionParam = useMemo(
    () => obtenerRegionActual(selectedRegion, user?.regiones),
    [selectedRegion, user?.regiones]
  );

  const allowed = useMemo(
    () => obtenerDelegacionesVista(user?.delegaciones, regionParam, delegacionesVista),
    [user?.delegaciones, regionParam, delegacionesVista]
  );

  const mps = useMemo(() => {
    if (propsMode === 'none') return null;
    const resolved = resolverMainplant({
      seleccion: selectedDelegations,
      permitidas: allowed,
      modo: 'estricto',
      devolverNullSinPermitidas: propsMode === 'mps-optional',
    });
    console.debug(`[GenericModuleWrapper] Resolved mps for ${delegacionesVista}:`, { 
      resolved, 
      selectedDelegations, 
      allowedCount: allowed.length 
    });
    return resolved;
  }, [selectedDelegations, allowed, propsMode, delegacionesVista]);

  switch (propsMode) {
    case 'mps':
      return <Component mps={mps ?? ''} />;
    case 'mainplant':
      return <Component mainplant={mps ?? ''} />;
    case 'mps-optional':
      return <Component mps={mps ?? undefined} />;
    case 'region-mps':
      return <Component region={regionParam} mps={mps ?? ''} />;
    case 'usuario':
      return <Component codTecnico={user?.codigo_usuario ?? ''} />;
    case 'none':
    default:
      return <Component />;
  }
}
  