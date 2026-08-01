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
};
