import { apiFetch } from "./api";
import type { SlaSt02Row } from "./Types";

export async function fetchMaquinasRetiradas(mainplants: string[] | { mainplant: string }[], fechaInicio: string, fechaFin: string) {
  const mpsArray = typeof mainplants[0] === 'string' 
    ? mainplants as string[] 
    : (mainplants as { mainplant: string }[]).map(mp => mp.mainplant);
  const mpsStr = mpsArray.join("-");
  return apiFetch(`external-api/maquinas-retiradas?mainplants=${mpsStr}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
}

export async function fetchSlaSt02(mainplant: string): Promise<SlaSt02Row[]> {
  return apiFetch(`external-api/sla-st02?mainplant=${mainplant}`);
}
  