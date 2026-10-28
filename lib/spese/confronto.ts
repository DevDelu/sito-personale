// Confronto del riepilogo con il periodo immediatamente precedente, di pari
// durata. Funzioni pure (nessun accesso ai dati), testate in confronto.test.ts.

const GIORNO_MS = 24 * 60 * 60 * 1000;

function giorniTra(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / GIORNO_MS) + 1;
}

function aggiungiGiorni(iso: string, n: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + n * GIORNO_MS).toISOString().slice(0, 10);
}

// Stessa durata, finisce il giorno prima dell'inizio del periodo attivo.
// null se le date non sono valide o il periodo è invertito.
export function periodoPrecedente(from: string, to: string): { from: string; to: string } | null {
  const durata = giorniTra(from, to);
  if (!Number.isFinite(durata) || durata < 1) return null;
  return { from: aggiungiGiorni(from, -durata), to: aggiungiGiorni(from, -1) };
}

export type Confronto = { percentuale: number; direzione: "su" | "giu" | "uguale" };

// Variazione percentuale rispetto al periodo precedente. Con precedente <= 0
// (nessun dato prima) il confronto non ha senso: null, niente divisione per zero.
export function confrontaTotali(corrente: number, precedente: number): Confronto | null {
  if (!Number.isFinite(corrente) || !Number.isFinite(precedente) || precedente <= 0) return null;
  const percentuale = Math.round(((corrente - precedente) / precedente) * 100);
  return { percentuale: Math.abs(percentuale), direzione: percentuale > 0 ? "su" : percentuale < 0 ? "giu" : "uguale" };
}
