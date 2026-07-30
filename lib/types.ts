export type TipoCategoria = "spesa" | "entrata";

export type Categoria = {
  id: string;
  nome: string;
  colore: string | null;
  tipo: TipoCategoria;
};

export type Spesa = {
  id: string;
  importo: number;
  titolo: string | null;
  descrizione: string | null;
  categoria_id: string | null;
  categoria_nome: string | null;
  categoria_colore: string | null;
  categoria_banca: string | null;
  nominativo: string | null;
  dettaglio: string | null;
  note: string | null;
  data: string;
  settimana_riferimento: string | null;
  fonte: string;
};

export type Deposito = {
  id: string;
  importo: number;
  titolo: string | null;
  descrizione: string | null;
  categoria_id: string | null;
  categoria_nome: string | null;
  categoria_colore: string | null;
  categoria_banca: string | null;
  nominativo: string | null;
  dettaglio: string | null;
  note: string | null;
  data: string;
  fonte: string;
};
