export type DraftSpesaRow = {
  importo: number;
  titolo: string | null;
  descrizione: string | null;
  categoriaNome: string | null;
  categoria_banca: string | null;
  data: string;
  fonte: string;
};

export type DraftDepositoRow = {
  importo: number;
  titolo: string | null;
  descrizione: string | null;
  categoria_banca: string | null;
  data: string;
  fonte: string;
};

export type ParseResult =
  | {
      ok: true;
      spese: DraftSpesaRow[];
      depositi: DraftDepositoRow[];
      skippedIgnored: number;
      skippedInvalidRows: number[];
    }
  | { ok: false; error: string };
