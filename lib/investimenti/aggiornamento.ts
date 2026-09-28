// Ogni quanto /investimenti rilancia da sola l'aggiornamento prezzi: Yahoo e
// CoinGecko sono gratuiti ma con limiti, 15 minuti bastano per un
// portafoglio personale e restano "in tempo reale" rispetto al cron
// giornaliero.
export const INTERVALLO_AGGIORNAMENTO_MS = 15 * 60 * 1000;

export function prezziDaAggiornare(ultimoAggiornamentoMs: number | null, adessoMs: number): boolean {
  if (ultimoAggiornamentoMs === null || !Number.isFinite(ultimoAggiornamentoMs)) return true;
  // Orologio spostato indietro: meglio un aggiornamento in più che prezzi fermi.
  if (ultimoAggiornamentoMs > adessoMs) return true;
  return adessoMs - ultimoAggiornamentoMs >= INTERVALLO_AGGIORNAMENTO_MS;
}
