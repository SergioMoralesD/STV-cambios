// ─── INTERFACES TRAZABILIDAD DE FC POR AVERÍAS ────────────────────────────

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

export interface SlaSt02Row {
  DELEGACION: string;
  MODELO: string;
  MATRICULA: string;
  SUBFAMILIA: string;
  TIPO_FAMILIA: string;
  SLA: number | null;
  FECHA: string;
  TIPO_AVISO: string;
  rn: number;
}

export interface Redisposiciones {
  MATRICULA: number;
  NOMBRE_MODELO: string;
  NOMBRE_FAMILIA: string;
  TIPO_FRIO: string;
  AVISO: string;
  FECHA_FD: string;
  NIVEL: number;
  rn: number;
}
  