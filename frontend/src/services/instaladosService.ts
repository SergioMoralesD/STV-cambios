import { apiFetch } from "./api";

export async function fetchFAEquiposInstalados(mainplants: string | string[], fechaInicio: string, fechaFin: string) {
  const mps = Array.isArray(mainplants) ? mainplants.join("-") : mainplants;
  return apiFetch(`external-api/equipos-instalados?mainplants=${mps}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
}
  