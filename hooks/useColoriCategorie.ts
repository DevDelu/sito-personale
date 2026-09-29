"use client";

import { useCallback, useMemo } from "react";
import { mappaColoriCategorie } from "@/lib/category-palette";
import { categoryColor } from "@/lib/category-style";

// Stesso colore per categoria ovunque in Spese (grafici, liste, badge,
// selettore in "Nuovo movimento"): prima la correzione del 27/09 valeva solo
// nei grafici, e altrove le categorie con colore doppio o mancante nel DB
// restavano tutte uguali. Passare TUTTE le categorie (spese ed entrate),
// come fanno i grafici, così la mappa è la stessa in ogni schermata.
export function useColoriCategorie(categorie: { nome: string; colore: string | null }[]) {
  const mappa = useMemo(() => mappaColoriCategorie(categorie), [categorie]);
  return useCallback(
    (nome: string | null | undefined, salvato?: string | null) =>
      (nome ? mappa.get(nome) : undefined) ?? salvato ?? categoryColor(nome),
    [mappa]
  );
}
