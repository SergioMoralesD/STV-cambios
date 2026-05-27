/**
 * Obtiene el valor de una cookie por nombre
 */
export function getCookie(name: string): string | null {
  const iniResult = document.cookie.indexOf(name + "=");
  if (iniResult === -1) return null;
  const start = document.cookie.indexOf("=", iniResult) + 1;
  let end = document.cookie.indexOf(";", start);
  if (end === -1) end = document.cookie.length;
  return decodeURIComponent(document.cookie.substring(start, end));
}

/**
 * Establece una cookie con una duración predeterminada
 */
export function setCookie(name: string, value: string): void {
  const d = new Date();
  // Duración larga por defecto
  d.setTime(d.getTime() + 1 * 60 * 100_000_000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/`;
}

/**
 * Elimina una cookie
 */
export function deleteCookie(name: string): void {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}
  