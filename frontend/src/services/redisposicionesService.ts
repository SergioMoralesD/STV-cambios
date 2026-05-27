import { apiFetch } from "./api";
import type { Redisposiciones } from "./Types";

export async function fetchRedisposiciones(mainplant: string): Promise<Redisposiciones[]> {
  return apiFetch(`external-api/redisposiciones?mainplant=${mainplant}`);
}
  