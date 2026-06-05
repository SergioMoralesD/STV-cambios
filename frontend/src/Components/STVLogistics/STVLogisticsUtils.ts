import {
  obtenerImagenIsla,
  obtenerMetaIslas,
  obtenerNombreIsla,
} from "../../config/regionConfig";

const META_ISLAS = obtenerMetaIslas();
const ISLAS_KEYS = Object.keys(META_ISLAS);

export const ISLA_NOMBRE: Record<string, string> = Object.fromEntries(
  ISLAS_KEYS.map((code) => [code, obtenerNombreIsla(code)]),
) as Record<string, string>;

/** Código de imagen para cada delegación (fichero en /public/img/) */
export const ISLA_IMG: Record<string, string> = Object.fromEntries(
  ISLAS_KEYS.map((code) => [code, obtenerImagenIsla(code)]),
) as Record<string, string>;

export function getImg(deleg: string): string {
  return obtenerImagenIsla(deleg);
}
  