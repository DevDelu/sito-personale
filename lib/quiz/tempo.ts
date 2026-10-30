// Il tempo arriva dal client e non è verificabile: lo si normalizza per
// evitare valori assurdi in classifica (0 ms, negativi, NaN, enormi).
export const MS_MINIMI_PER_DOMANDA = 400;
export const MS_MASSIMI = 30 * 60 * 1000;

export function normalizzaTempo(raw: unknown, domande: number): number {
  const minimo = MS_MINIMI_PER_DOMANDA * Math.max(1, domande);
  const valore = typeof raw === "number" && Number.isFinite(raw) ? Math.round(raw) : 0;
  return Math.min(MS_MASSIMI, Math.max(minimo, valore));
}
