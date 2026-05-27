// ─── INTERFACES FAS EQUIPOS RECIÉN INSTALADOS ─────────────────────────────

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
  