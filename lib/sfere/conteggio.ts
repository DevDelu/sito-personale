// Logica pura dell'easter egg delle sette sfere (nessun accesso a window).
export const TOTALE_SFERE = 7;

/** Legge il valore salvato: accetta solo un array JSON di interi 1..7, senza doppioni. */
export function leggiSfere(raw: string | null | undefined): number[] {
  if (!raw) return [];
  try {
    const dati: unknown = JSON.parse(raw);
    if (!Array.isArray(dati)) return [];
    const valide = dati.filter(
      (n): n is number => Number.isInteger(n) && n >= 1 && n <= TOTALE_SFERE,
    );
    return [...new Set(valide)].sort((a, b) => a - b);
  } catch {
    return [];
  }
}

/** Aggiunge una sfera; idempotente e ordinata. Numeri fuori 1..7 sono ignorati. */
export function raccogli(attuali: number[], n: number): number[] {
  if (!Number.isInteger(n) || n < 1 || n > TOTALE_SFERE) return attuali;
  if (attuali.includes(n)) return attuali;
  return [...attuali, n].sort((a, b) => a - b);
}

export function completo(raccolte: number[]): boolean {
  return raccolte.length >= TOTALE_SFERE;
}
