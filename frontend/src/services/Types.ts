// ─── INTERFACES ────────────────────────────────────────────────────────────

export interface Tecnico {
  codigo: string;
  nombre: string;
  fototec: string | null;
}

export interface Averia {
  cod_tec: string;
  nombre_zona: string;
  cliente: string;
  familia: string;
  tipo_aviso: string;
  delta_origen: string;
  recurrente: boolean;
  userstatus: string;
  codeactivity: string | null;
  codigo: string;
  aviso: string;
  fecha_aviso: string;
  tiempo_total: string;
  nombre_estado: string;
  direccion: string;
  cod_post: string;
  cli_cit: string;
  tfn_cliente: string;
  nombre_contacto: string;
  cod_indicado: string;
  notas_phonefix: string | null;
  intervenciones_text: string;
  averiaanterior_text: string;
  delegacion: string;
}

export interface AveriaSLA {
  AVISO: string;
  CLIENTE: string;
  FILI: string;
  CLI_CIT: string;
  COD_POST: string;
  FECHA_HORA: string;
  TECNICO: string | null;
  FAMILIA: string;
  USTATUS: number;
  USERSTATUS: string;
  CODIGO_PAUSA: string;
  CODEACTIVITY: string | null;
  DELTA_ORIGEN: number;
  TIPO_AVISO: string;
  FILIAL: string;
  SLA_PAUSA: number | null;
  SLA: number;
  TIME: number;
  TIME_PAUSA: number | null;
  delegacion?: string;
  codigo?: string;
}

export interface ColumnaIsla {
  id: string;
  label: string;
  mainplant: string;
  img: string;
}

export interface Mainplant {
  mainplant: string;
  is: string;
}

export interface AveriaActividad {
  DELEG: string;
  FAMILIA: string;
  TIPO: string;
  AVISO: string;
  CLIENTE: string;
  FECHA_PLANIFICADA: string | null;
  DIFERENCIA: number;
  DIFERENCIA2: number;
  USERSTATUS: string;
  MATERIAL?: string;
}

export interface RecuentoEstado {
  DELEGACION: string;
  TIPO: string;
  ACTIVAS: number | string;
  PAUSA: number | string;
}

export interface ResumenList {
  dispensing_ejec: number;
  dispensing_pausa: number;
  vitrina_ejec: number;
  vitrina_pausa: number;
  vending_ejec: number;
  vending_pausa: number;
  botellero_ejec: number;
  botellero_pausa: number;
  sin_familia_ejec: number;
  sin_familia_pausa: number;
}

export interface ResumenGenExec {
  DIA: string;
  ENTRE_SEMANA: string;
}

export interface AveriaData {
  tecnicos: Tecnico[];
  averias: Averia[];
}

export interface ResumenData {
  list: ResumenList;
  generated: ResumenGenExec;
  executed: ResumenGenExec;
}

export interface MetricaData {
  DISPENSING?: string;
  VITRINA?: string;
  VENDING?: string;
  BOTELLERO?: string;
  DI?: string;
  VI?: string;
  VE?: string;
  BO?: string;
  PERC?: string;
}

export interface AllMetricas {
  relojes: { semana: string; mes: string; anio: string };
  ejecucion: { semana: MetricaData; mes: MetricaData; anio: MetricaData };
  resolucion: { semana: MetricaData; mes: MetricaData; anio: MetricaData };
  porcentaje: { semana: MetricaData; mes: MetricaData; anio: MetricaData };
  porcentajeTiempo: {
    semana: MetricaData;
    mes: MetricaData;
    anio: MetricaData;
  };
  tiemposAnio?: Record<string, IslaData>;
  tiemposMes?: Record<string, IslaData>;
}

export interface IslaData {
  DI: string;
  VI: string;
  VE: string;
  BO: string;
}

export interface MaquinaRetirada {
  fechaini: string;
  fechafin: string;
  cod_retirada: string;
  matricula_asignada: string;
  matricula: string;
  fecha_ejecucion: string;
  delegacion: string;
  subfamilia: string;
  cod_modelo: string;
  modelo: string;
  cliente_cod: string;
  cliente_nombre: string;
  tipo_trabajo: string;
  accion: string;
  concambio: boolean;
  solicitud_cambio_text: string;
  redisposiciones_text: string;
}

export interface FAEquipo {
  fechaini: string;
  fechafin: string;
  cod_trabajo: string;
  matricula_asignada: string;
  matricula: string;
  fecha_ejecucion: string;
  delegacion: string;
  subfamilia: string;
  cod_modelo: string;
  modelo: string;
  cliente_cod: string;
  cliente_nombre: string;
  tipo_trabajo: string;
  accion: string;
  conaveria: boolean;
  averias_text: string;
  intervenciones_text: string;
  redisposiciones_text: string;
}

export interface SlaSt02Row {
  DELEGACION: string;
  MODELO: string;
  MATRICULA: string;
  SUBFAMILIA: string;
  TIPO_FAMILIA: string;
  SLA: number | null;
  FECHA: string;
  TIPO_AVISO: string;
  FAMILIA?: string;
  DESCRIPCION_ESTADO?: string;
  ESTADO_SOLICITUD_REDISPOSICION?: string | null;
  rn: number;
}

export interface Redisposiciones {
  DELEGACION: string;
  MODELO: string;
  MATRICULA: string;
  SUBFAMILIA: string;
  TIPO_FAMILIA: string;
  NOMBRE_FAMILIA?: string;
  TIPO_FRIO?: string;
  NOMBRE_MODELO?: string;
  SLA: number | null;
  DESCRIPCION_ESTADO?: string;
  ESTADO_SOLICITUD_REDISPOSICION?: string | null;
  NIVEL?: number;
  rn: number;
}

export interface Sanitizacion {
  [key: string]: unknown;
}

export interface AvisoLimpieza {
  [key: string]: unknown;
}

export interface LogisticsFullResponse {
  logistics: {
    averias: AveriaActividad[];
    recuentos: RecuentoEstado[];
  };
  metricas: AllMetricas;
}

export interface LogisticsDashboardResponse {
  metrics?: unknown[];
  reports?: unknown[];
  averias?: AveriaActividad[];
  recuentos?: RecuentoEstado[];
}
  