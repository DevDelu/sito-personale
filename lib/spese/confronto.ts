// Confronto del periodo scelto con quello immediatamente precedente della stessa durata.

const GIORNO_MS = 24 * 60 * 60 * 1000;

function giorniTra(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / GIORNO_MS) + 1;
}

function aggiungiGiorni(iso: string, giorni: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + giorni * GIORNO_MS).toISOString().slice(0, 10);
}

/** Stessa durata, finisce il giorno prima di `from`. null se le date non sono valide. */
export function periodoPrecedente(from: string, to: string): { from: string; to: string } | null {
  const durata = giorniTra(from, to);
  if (!Number.isFinite(durata) || durata < 1) return null;
  return { from: aggiungiGiorni(from, -durata), to: aggiungiGiorni(from, -1) };
}

/** Variazione in % arrotondata; null se il periodo precedente è zero (niente divisione per zero). */
export function variazionePercentuale(attuale: number, precedente: number): number | null {
  if (!Number.isFinite(attuale) || !Number.isFinite(precedente) || precedente === 0) return null;
  return Math.round(((attuale - precedente) / Math.abs(precedente)) * 100);
}
