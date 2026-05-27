import { getClaseFamilia } from "../../config/regionConfig";
import type { SlaSt02Row } from "../../services/Types";
import { getSlaWarehouseClass, getSlaWarehouseMessage, esCabezal } from "../../services/commonLogic";
import type { Contadores, ColorCount } from "./types";

// ─── HELPERS ───────────────────────────────────────────────────────────────

export { getSlaWarehouseClass as getSlaClass };

export function getMessage(row: SlaSt02Row): string {
  return getSlaWarehouseMessage(row.SLA);
}

function emptyColorCount(): ColorCount {
  return { total: 0, verde: 0, amarillo: 0, rojo: 0 };
}

/** Convierte ESTADO_SOLICITUD_REDISPOSICION (string | number | null) en clave de color */
export function getRedisposicionColorKey(
  estado: string | number | null | undefined
): "verde" | "amarillo" | "rojo" {
  // null/undefined → rojo (sin solicitud de redisposición)
  if (estado === null || estado === undefined) return "rojo";
  const n = Number(estado);
  if (n === 1) return "verde";
  if (n === 0) return "amarillo";
  return "rojo";
}

/** Devuelve la clase CSS para la celda de redisposición */
export function getRedisposicionClass(
  estado: string | number | null | undefined
): string {
  const key = getRedisposicionColorKey(estado);
  if (key === "verde") return "orig-verde";
  if (key === "amarillo") return "orig-amarillo";
  return "orig-rojo";
}

export function buildContadores(rows: SlaSt02Row[]): Contadores {
  const c: Contadores = {
    DI: emptyColorCount(),
    VI: emptyColorCount(),
    VE: emptyColorCount(),
    BO: emptyColorCount(),
    CA: emptyColorCount(),
    EQ: 0,
  };

  rows.forEach((row) => {
    const subfamilia = row.SUBFAMILIA?.slice(0, -3) ?? "";
    const [familiaText] = getClaseFamilia(subfamilia, row.TIPO_AVISO);
    const colorKey = getRedisposicionColorKey(row.ESTADO_SOLICITUD_REDISPOSICION);

    if (esCabezal(row.TIPO_FAMILIA)) {
      c.CA.total++;
      c.CA[colorKey]++;
    } else {
      c.EQ++;
      const grupo = c[familiaText as keyof Omit<Contadores, "EQ">];
      if (grupo && typeof grupo === "object" && "total" in grupo) {
        grupo.total++;
        grupo[colorKey]++;
      }
    }
  });

  return c;
}
  