// Nucleo puro del rate limiter (senza server-only né next/headers, così si
// può testare con node:test). Vedi lib/rate-limit.ts per i limiti noti.
type Voce = { tempi: number[]; windowMs: number };

const tentativi = new Map<string, Voce>();

// Oltre questa soglia, a ogni chiamata si eliminano le chiavi con finestra
// ormai scaduta: senza, ogni IP visto resta in memoria finché l'istanza vive
// (crescita illimitata sotto scansioni/bot con IP diversi).
const SOGLIA_PULIZIA = 1000;

function pulisci(ora: number) {
  for (const [chiave, voce] of tentativi) {
    if (voce.tempi.every((t) => ora - t >= voce.windowMs)) tentativi.delete(chiave);
  }
}

export function checkRateLimit(
  key: string,
  opts: { max: number; windowMs: number },
  ora: number = Date.now()
): { allowed: boolean; retryAfterMs?: number } {
  if (tentativi.size > SOGLIA_PULIZIA) pulisci(ora);

  const finestra = (tentativi.get(key)?.tempi ?? []).filter((t) => ora - t < opts.windowMs);

  if (finestra.length >= opts.max) {
    const retryAfterMs = opts.windowMs - (ora - finestra[0]);
    tentativi.set(key, { tempi: finestra, windowMs: opts.windowMs });
    return { allowed: false, retryAfterMs };
  }

  finestra.push(ora);
  tentativi.set(key, { tempi: finestra, windowMs: opts.windowMs });
  return { allowed: true };
}

export function dimensioneRateLimit(): number {
  return tentativi.size;
}
