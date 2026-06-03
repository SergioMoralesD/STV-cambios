/**
 * moduleRegistry.ts
 *
 * Registro central de módulos de la aplicación.
 *
 * Clave: vista_codigo tal como aparece en la base de datos (ej: 'AVERIAS', 'STVLOGAG').
 *
 * Si añades un nuevo módulo:
 *   1. Importa el componente.
 *   2. Añade una entrada con su propsMode y delegacionesVista.
 */

import type { ComponentType } from 'react';

import AveriasPage from '../Pages/menuB2B/Averias/AveriasPage';
import AveriasRepetitivasPage from '../Pages/menuB2B/AveriasRepetitivas/AveriasRepetitivasPage';
import AveriasSLAPage from '../Pages/menuB2B/Averias_SLA/Averias_SLA';
import STVLogisticsPage from '../Pages/menuB2B/STVLogistics/LogisticsDashboardPage';
import SanitizacionesYMantenimientosPage from '../Pages/menuB2B/SanitizacionesYMantenimientos/SanitizacionesYMantenimientos';
import FAEquiposDashboard from '../Pages/menuB2B/FAEquiposInstalados/FAEquiposDashboard';
import RedisposicionesDashboard from '../Pages/menuB2B/Redisposiciones/RedisposicionesDashboard';
import SlaSt02Dashboard from '../Pages/menuB2B/SLAST02/SlaSt02Dashboard';
import TrazabilidadDeFCPorAverias from '../Pages/menuB2B/TrazabilidadDeFCPorAverias/TrazabilidadDeFCPorAverias';
import TrabajoClientePage from '../Pages/menuB2B/TrabajoCliente/TrabajoCliente';
import STVTrackerDashboard from '../Pages/menuB2B/STVTracker/STVTrackerDashboard';
import FLyFB from '../Pages/menuB2B/FLyFB/FLyFB';
import STVLogisticaAgenda from '../Pages/menuB2B/STVLogisticaAgenda/STVLogisticaAgenda';
import RankProductividad from '../Pages/menuB2B/RankProductividadTecnicos/Productividad';
import Productividad from '../Pages/menuB2B/ProductividadTecnicos/Productividad';
import AprovisionamientoRepuestos from '../Pages/menuB2B/AprovisionamientoRepuestos/AprovisionamientoRepuestos';
import RepuestosSinInventariar from '../Pages/menuB2B/RepuestosSinInventariar/RepuestosSinInventariar';
import ConsumoDashboard from '../Pages/menuB2B/Consumos/ConsumoDashboard';
import Recursos from '../Pages/menuB2B/Recursos/Recursos';
import PedidosRepuestos from '../Pages/menuB2B/Pedidos_Repuestos/PedidosRepuestos';


// ── Tipos ──────────────────────────────────────────────────────────────────────

/**
 * Modo de inyección de props al componente:
 *  - none:         Sin props extra (el componente lee el contexto internamente).
 *  - mps:          Recibe { mps: string }.
 *  - mainplant:    Recibe { mainplant: string }.
 *  - mps-optional: Recibe { mps?: string } (null si no hay delegaciones permitidas).
 *  - region-mps:   Recibe { region: string; mps: string }.
 *  - tecnico:      Recibe { codTecnico: string }.
 */
export type PropsMode = 'none' | 'mps' | 'mainplant' | 'mps-optional' | 'region-mps' | 'usuario';

export interface ModuleConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: ComponentType<any>;
  propsMode: PropsMode;
  /** Código de vista (clave en `delegaciones[region]`) para resolver delegaciones permitidas. */
  delegacionesVista: string;
  /** Ruta opcional si difiere del código en minúsculas */
  path?: string;
  /** Roles permitidos específicamente para este módulo (opcional) */
  allowedRoles?: string[];
}

// ── Registro ───────────────────────────────────────────────────────────────────

export const MODULE_REGISTRY: Record<string, ModuleConfig> = {
  // ── Sin props (leen el contexto internamente) ──────────────────────────────
  'AVERIAS': { Component: AveriasPage, propsMode: 'none', delegacionesVista: 'AVERIAS', path: 'averias' },
  'AVREPE': { Component: AveriasRepetitivasPage, propsMode: 'none', delegacionesVista: 'AVREPE', path: 'AveriasRepetitivas' },
  'AVSLA': { Component: AveriasSLAPage, propsMode: 'none', delegacionesVista: 'AVSLA', path: 'Averias_SLA' },
  'STVLOG': { Component: STVLogisticsPage, propsMode: 'none', delegacionesVista: 'STVLOG', path: 'STVLogistics' },
  'SANMTTO': { Component: SanitizacionesYMantenimientosPage, propsMode: 'none', delegacionesVista: 'SANMTTO', path: 'SanitizacionesYMantenimientos' },
  'TRABCL': { Component: TrabajoClientePage, propsMode: 'none', delegacionesVista: 'TRABCL', path: 'Trabajo_Cliente' },
  'RANKPROD': { Component: RankProductividad, propsMode: 'none', delegacionesVista: 'RANKPROD', path: 'Ranking_Tecnicos' },
  'PRODTEC': { Component: Productividad, propsMode: 'none', delegacionesVista: 'PRODTEC', path: 'Gestion_Tecnicos' },
  'REPAVRO': { Component: AprovisionamientoRepuestos, propsMode: 'none', delegacionesVista: 'REPAVRO', path: 'AprovisionamientoRepuestos' },
  'REPINV': { Component: RepuestosSinInventariar, propsMode: 'none', delegacionesVista: 'REPINV', path: 'RepuestosSinInventariar' },

  // ── Con props { mps: string } ──────────────────────────────────────────────
  'FAEQUIP': { Component: FAEquiposDashboard, propsMode: 'mps', delegacionesVista: 'FAEQUIP', path: 'FA_de_Equipos_recien_instalados' },
  'TRAZFC': { Component: TrazabilidadDeFCPorAverias, propsMode: 'mps', delegacionesVista: 'TRAZFC', path: 'Trazabilidad_De_FC_por_averia' },
  'STVTRACK': { Component: STVTrackerDashboard, propsMode: 'mps', delegacionesVista: 'STVTRACK', path: 'STVTracker_Escritorio' },
  'STVLOGAG': { Component: STVLogisticaAgenda, propsMode: 'mps', delegacionesVista: 'STVLOGAG' },

  // ── Con props { mainplant: string } ───────────────────────────────────────
  'FDST01': { Component: RedisposicionesDashboard, propsMode: 'mainplant', delegacionesVista: 'FDST01', path: 'Nivel_Redisposicion' },
  'SLAST02': { Component: SlaSt02Dashboard, propsMode: 'mainplant', delegacionesVista: 'SLAST02', path: 'SLA_ST02' },

  // ── Con props { mps?: string } (null si sin permisos) ─────────────────────
  'FLYFB': { Component: FLyFB, propsMode: 'mps-optional', delegacionesVista: 'FLYFB', path: 'Trabajo_FL_FB' },

  // ── Con props { region: string; mps: string } ──────────────────────────────
  'CONREP': { Component: ConsumoDashboard, propsMode: 'region-mps', delegacionesVista: 'CONREP', path: 'Consumo' },
  'CONREPM': { Component: ConsumoDashboard, propsMode: 'region-mps', delegacionesVista: 'CONREPM', path: 'Consumo_Repuestos_Maquinas' },
  'RECUR': { Component: Recursos, propsMode: 'none', delegacionesVista: 'RECUR', path: 'recursos' },
  'PEDREP': { Component: PedidosRepuestos, propsMode: 'usuario', delegacionesVista: 'PEDREP', path: 'Pedidos_Repuestos' },
};

  