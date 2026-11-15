/** Primo e ultimo giorno del mese precedente a `oggi` (YYYY-MM-DD, calcolo in UTC). */
export function meseScorso(oggi: string): { from: string; to: string } {
  const [y, m] = oggi.split("-").map(Number);
  const primo = new Date(Date.UTC(y, m - 2, 1));
  const ultimo = new Date(Date.UTC(y, m - 1, 0));
  return { from: primo.toISOString().slice(0, 10), to: ultimo.toISOString().slice(0, 10) };
}
