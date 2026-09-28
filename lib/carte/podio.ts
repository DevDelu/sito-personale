export type PosizionePodio = 1 | 2 | 3;

// Ordine visivo del podio da sinistra a destra: 2° – 1° – 3°, con il primo
// al centro. Riceve le carte già ordinate per valore (getCollectionOverview)
// e salta i gradini vuoti quando le carte sono meno di tre.
export function ordinePodio<T>(carte: T[]): { carta: T; posizione: PosizionePodio }[] {
  const conPosizione = carte
    .slice(0, 3)
    .map((carta, i) => ({ carta, posizione: (i + 1) as PosizionePodio }));
  const ordine: PosizionePodio[] = [2, 1, 3];
  return ordine.flatMap((p) => conPosizione.filter((c) => c.posizione === p));
}
