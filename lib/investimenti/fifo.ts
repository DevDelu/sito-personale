import type { CostoTipo, Transazione } from "./types";

const EPSILON = 1e-9;

export type EsitoFifo = {
  quantitaNetta: number;
  quantitaCostoNoto: number;
  costoTotaleCarico: number;
  hasStimato: boolean;
  hasSconosciuto: boolean;
};

type Lotto = { quantita: number; prezzo: number; costoTipo: CostoTipo };

// Costo medio di carico calcolato col metodo FIFO (obbligatorio fiscalmente
// in Italia): le vendite consumano prima i lotti di acquisto più vecchi.
// I lotti con costo_tipo='sconosciuto' restano nella quantità netta (il
// valore corrente del portafoglio li include) ma sono esclusi dal costo
// totale, quindi anche dalla plusvalenza calcolata su quella quota.
export function calcolaFifo(transazioni: Transazione[]): EsitoFifo {
  const ordinate = [...transazioni].sort((a, b) => a.data.localeCompare(b.data));
  const lotti: Lotto[] = [];
  let hasStimato = false;
  let hasSconosciuto = false;

  for (const t of ordinate) {
    if (t.costo_tipo === "stimato") hasStimato = true;
    if (t.costo_tipo === "sconosciuto") hasSconosciuto = true;

    if (t.tipo === "buy") {
      lotti.push({ quantita: t.quantita, prezzo: t.prezzo_unitario ?? 0, costoTipo: t.costo_tipo });
      continue;
    }

    let daVendere = t.quantita;
    while (daVendere > EPSILON && lotti.length > 0) {
      const lotto = lotti[0];
      const consumata = Math.min(lotto.quantita, daVendere);
      lotto.quantita -= consumata;
      daVendere -= consumata;
      if (lotto.quantita <= EPSILON) lotti.shift();
    }
  }

  let quantitaNetta = 0;
  let quantitaCostoNoto = 0;
  let costoTotaleCarico = 0;

  for (const lotto of lotti) {
    quantitaNetta += lotto.quantita;
    if (lotto.costoTipo !== "sconosciuto") {
      quantitaCostoNoto += lotto.quantita;
      costoTotaleCarico += lotto.quantita * lotto.prezzo;
    }
  }

  return { quantitaNetta, quantitaCostoNoto, costoTotaleCarico, hasStimato, hasSconosciuto };
}
