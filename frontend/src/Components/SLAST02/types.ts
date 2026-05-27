// ─── TYPES ─────────────────────────────────────────────────────────────────

export interface ColorCount {
  total: number;
  verde: number;
  amarillo: number;
  rojo: number;
}

export interface Contadores {
  DI: ColorCount;
  VI: ColorCount;
  VE: ColorCount;
  BO: ColorCount;
  CA: ColorCount;
  EQ: number;
}

// Alias para la tabla resumen (mismas claves, mismo tipo)
export type ContadoresResumen = Omit<Contadores, "EQ">;

export interface TooltipState {
  visible: boolean;
  text: string;
  x: number;
  y: number;
}

export interface TooltipHandlers {
  onMouseEnter: (text: string, x: number, y: number) => void;
  onMouseMove: (x: number, y: number, text: string) => void;
  onMouseLeave: () => void;
}
  