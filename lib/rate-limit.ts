import "server-only";
import { headers } from "next/headers";

// Rate limiter in-memory per istanza serverless: zero setup, zero costo.
// Limite noto: su Vercel ogni cold start / regione ha la sua memoria, quindi
// non è un limite globale rigoroso — resta comunque un deterrente reale
// contro retry rapidi dallo stesso client, sufficiente per il traffico di un
// sito personale. Se in futuro serve un limite distribuito, il passo
// successivo è Upstash Redis (free tier, si integra bene con Vercel).
const tentativi = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  opts: { max: number; windowMs: number }
): { allowed: boolean; retryAfterMs?: number } {
  const ora = Date.now();
  const finestra = (tentativi.get(key) ?? []).filter((t) => ora - t < opts.windowMs);

  if (finestra.length >= opts.max) {
    const retryAfterMs = opts.windowMs - (ora - finestra[0]);
    tentativi.set(key, finestra);
    return { allowed: false, retryAfterMs };
  }

  finestra.push(ora);
  tentativi.set(key, finestra);
  return { allowed: true };
}

// x-forwarded-for può contenere una lista "client, proxy1, proxy2": il primo
// valore è il client originale. x-real-ip come fallback (alcuni proxy lo
// usano al posto di x-forwarded-for). "unknown" se nessuno dei due è
// presente (es. in locale senza proxy davanti) — meglio raggruppare tutti i
// richiedenti senza IP sotto una chiave sola che far fallire il rate limit.
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}
