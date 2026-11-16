// Variazione "di oggi" di una posizione: ultimo prezzo di oggi (Europe/Rome)
// contro l'ultima chiusura con data anteriore. Se oggi non c'è ancora un
// prezzo (weekend, festivo, mercato non aggiornato) o manca la chiusura
// precedente, non si inventa uno zero: il risultato è null.

export type PrezzoDatato = { data: string; prezzo: number };

export type VariazioneGiorno = {
  /** Variazione per unità (prezzo di oggi − chiusura precedente). */
  perUnita: number;
  /** Variazione percentuale rispetto alla chiusura precedente. */
  percentuale: number;
  /** Variazione dell'intera posizione (quantità × perUnita). */
  importo: number;
};

/**
 * @param ultimo prezzo più recente noto
 * @param precedente ultimo prezzo con data anteriore a `ultimo.data`
 * @param quantita quantità usata per il valore attuale
 * @param oggi "YYYY-MM-DD" in Europe/Rome
 */
export function variazioneGiorno(
  ultimo: PrezzoDatato | null | undefined,
  precedente: PrezzoDatato | null | undefined,
  quantita: number,
  oggi: string,
): VariazioneGiorno | null {
  if (!ultimo || !precedente) return null;
  if (ultimo.data !== oggi || precedente.data >= oggi) return null;
  if (!(precedente.prezzo > 0) || !Number.isFinite(ultimo.prezzo)) return null;
  const perUnita = ultimo.prezzo - precedente.prezzo;
  return {
    perUnita,
    percentuale: (perUnita / precedente.prezzo) * 100,
    importo: perUnita * quantita,
  };
}

/** Somma le variazioni delle posizioni che ne hanno una; null se nessuna. */
export function variazioneTotale(
  variazioni: Array<{ variazione: VariazioneGiorno | null; valoreAttuale: number | null }>,
): { importo: number; percentuale: number | null } | null {
  const conDato = variazioni.filter((v) => v.variazione !== null);
  if (conDato.length === 0) return null;
  const importo = conDato.reduce((s, v) => s + (v.variazione as VariazioneGiorno).importo, 0);
  const valoreOggi = conDato.reduce((s, v) => s + (v.valoreAttuale ?? 0), 0);
  const valoreIeri = valoreOggi - importo;
  return { importo, percentuale: valoreIeri > 0 ? (importo / valoreIeri) * 100 : null };
}
