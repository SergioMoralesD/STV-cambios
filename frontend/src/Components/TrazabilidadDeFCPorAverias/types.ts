import type { Mainplant } from "../../services/Types";
export type { Mainplant };

export interface Actividad {
  MOTIVO?: string;
  NOTAS?: string;
  [key: string]: string | undefined;
}

export interface Intervencion {
  NIVEL?: string;
  FECHA?: string;
  DESC?: string;
  TECNICO?: string;
  NOMBRE?: string;
  ACTIVIDADES?: Actividad[];
  [key: string]: string | Actividad[] | undefined;
}

export interface TooltipState {
  text: string;
  x: number;
  y: number;
}
  