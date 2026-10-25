// Ritenta una richiesta HTTP quando il servizio risponde "troppe richieste"
// (429) o con un errore temporaneo (5xx). CoinGecko free ha limiti stretti e
// condivide gli IP di Vercel con altri: un 429 isolato non deve far fallire
// l'aggiornamento dei prezzi. Pura (fetch e attesa iniettabili) così è testabile.
export type OpzioniRetry = {
  tentativi?: number; // tentativi totali (default 3)
  attesaBaseMs?: number; // attesa dopo il 1° fallimento, raddoppia (default 1500)
  attesa?: (ms: number) => Promise<void>;
};

export function ritentabile(status: number): boolean {
  return status === 429 || status >= 500;
}

export async function fetchConRetry(
  esegui: () => Promise<Response>,
  { tentativi = 3, attesaBaseMs = 1500, attesa = (ms) => new Promise((r) => setTimeout(r, ms)) }: OpzioniRetry = {}
): Promise<Response> {
  let ultima: Response | null = null;
  for (let i = 0; i < tentativi; i++) {
    try {
      ultima = await esegui();
    } catch (e) {
      if (i === tentativi - 1) throw e;
      await attesa(attesaBaseMs * 2 ** i);
      continue;
    }
    if (!ritentabile(ultima.status) || i === tentativi - 1) return ultima;
    const retryAfter = Number(ultima.headers.get("retry-after"));
    const ms = Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 10) * 1000 : attesaBaseMs * 2 ** i;
    await attesa(ms);
  }
  return ultima as Response;
}
