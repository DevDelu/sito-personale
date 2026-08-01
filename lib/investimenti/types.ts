export type TipoAsset = "stock" | "etf" | "indice" | "crypto";
export type TipoTransazione = "buy" | "sell";
export type CostoTipo = "verificato" | "stimato" | "sconosciuto";

export type Asset = {
  id: string;
  ticker: string;
  isin: string | null;
  nome: string;
  tipo: TipoAsset;
  valuta: string;
  price_symbol: string | null;
  coingecko_id: string | null;
  quantita_riferimento_manuale: number | null;
};

export type Transazione = {
  id: string;
  asset_id: string;
  tipo: TipoTransazione;
  quantita: number;
  prezzo_unitario: number | null;
  data: string;
  costo_tipo: CostoTipo;
  note: string | null;
};

export type TransazioneConAsset = Transazione & {
  ticker: string;
  asset_nome: string;
  asset_tipo: TipoAsset;
  valuta: string;
};

export type Posizione = {
  asset: Asset;
  quantitaNetta: number;
  quantitaCostoNoto: number;
  costoTotaleCarico: number;
  costoMedioCarico: number | null;
  prezzoAttuale: number | null;
  prezzoAttualeData: string | null;
  prezzoAttualeFonte: "prezzi_storico" | "ultima_transazione" | null;
  valoreAttuale: number | null;
  plusvalenzaAssoluta: number | null;
  plusvalenzaPercentuale: number | null;
  hasStimato: boolean;
  hasSconosciuto: boolean;
  // Quantità usata per il valore attuale: la quantitaNetta calcolata da FIFO
  // sulle transazioni, a meno che l'asset non abbia una
  // quantita_riferimento_manuale (storico transazioni incompleto) — in quel
  // caso si usa quella per il valore di mercato, mentre costo/plusvalenza
  // restano sempre calcolati solo sulle transazioni note.
  quantitaValore: number;
  datiIncompleti: boolean;
};
