import { timingSafeEqual } from "node:crypto";

// Autorizza una richiesta cron: header `Authorization: Bearer <CRON_SECRET>`.
// Fail-closed: se CRON_SECRET manca (o è vuota) nessuna richiesta passa.
export function cronAutorizzato(
  authorization: string | null | undefined,
  secret: string | undefined,
): boolean {
  if (!secret || !authorization) return false;
  const atteso = Buffer.from(`Bearer ${secret}`);
  const ricevuto = Buffer.from(authorization);
  return atteso.length === ricevuto.length && timingSafeEqual(atteso, ricevuto);
}

// Da usare in cima a ogni route cron: ritorna la risposta 401 da restituire,
// oppure null se la richiesta è autorizzata.
export function rifiutaSeNonCron(request: Request): Response | null {
  if (cronAutorizzato(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return null;
  }
  return Response.json({ error: "Non autorizzato." }, { status: 401 });
}
