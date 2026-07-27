export type Categoria = {
  id: string;
  nome: string;
  colore: string | null;
};

export type Spesa = {
  id: string;
  importo: number;
  descrizione: string | null;
  categoria_id: string | null;
  categoria_nome: string | null;
  categoria_colore: string | null;
  data: string;
  settimana_riferimento: string | null;
  fonte: string;
};

export type Deposito = {
  id: string;
  importo: number;
  descrizione: string | null;
  data: string;
};
