// Link "come si esegue" sotto ogni esercizio in sessione: ricerca YouTube
// automatica (non un video curato a mano) — vedi discussione in sessione,
// l'utente ha preferito così invece di un link fisso per esercizio, così
// funziona subito anche per esercizi aggiunti in futuro. "shorts" nella
// query privilegia risultati brevi e dimostrativi rispetto a tutorial lunghi.
export function linkTutorialEsercizio(nomeEsercizio: string): string {
  const query = `${nomeEsercizio} esecuzione corretta shorts`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
