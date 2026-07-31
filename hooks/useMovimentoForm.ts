"use client";

import { useState } from "react";
import type { Categoria, TipoCategoria } from "@/lib/types";
import type { MovimentoPatch } from "@/hooks/useExpenseMutations";

export type MovimentoModificabile = {
  titolo: string | null;
  importo: number;
  data: string;
  categoria_id: string | null;
  tipo: TipoCategoria;
  descrizione: string | null;
  nominativo: string | null;
  dettaglio: string | null;
};

// Stato di form condiviso da ExpenseEditModal (Gestione) e TransactionDetailModal
// (Overview): stessa logica di campi/validazione, contenitori distinti.
export function useMovimentoForm(movimento: MovimentoModificabile, categorie: Categoria[]) {
  const [titolo, setTitolo] = useState(movimento.titolo ?? "");
  const [importo, setImporto] = useState(String(movimento.importo));
  const [data, setData] = useState(movimento.data);
  const [categoriaId, setCategoriaId] = useState(movimento.categoria_id ?? "");
  const [descrizione, setDescrizione] = useState(movimento.descrizione ?? "");
  const [nominativo, setNominativo] = useState(movimento.nominativo ?? "");
  const [dettaglio, setDettaglio] = useState(movimento.dettaglio ?? "");

  const categoriaSelezionata = categorie.find((c) => c.id === categoriaId);
  const mostraNominativo = categoriaSelezionata?.nome === "Bonifici";
  const mostraDettaglio = categoriaSelezionata?.nome === "PayPal";

  function buildPatch(): MovimentoPatch {
    return {
      titolo,
      importo: Number(importo.replace(",", ".")),
      data,
      categoria_id: categoriaId,
      descrizione: descrizione || null,
      nominativo: mostraNominativo ? nominativo || null : null,
      dettaglio: mostraDettaglio ? dettaglio || null : null,
    };
  }

  return {
    titolo,
    setTitolo,
    importo,
    setImporto,
    data,
    setData,
    categoriaId,
    setCategoriaId,
    descrizione,
    setDescrizione,
    nominativo,
    setNominativo,
    dettaglio,
    setDettaglio,
    mostraNominativo,
    mostraDettaglio,
    buildPatch,
  };
}
