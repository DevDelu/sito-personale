// Intervalli rapidi del grafico "Andamento portafoglio". Lo storico ha un
// punto al giorno: 1 settimana è il più corto che abbia senso mostrare.
export type IntervalloRapido = "1s" | "1m" | "3m" | "6m" | "1a" | "tutto";

export const INTERVALLI_RAPIDI: { value: IntervalloRapido; label: string; giorni: number | null }[] = [
  { value: "1s", label: "1 sett.", giorni: 7 },
  { value: "1m", label: "1 mese", giorni: 30 },
  { value: "3m", label: "3 mesi", giorni: 91 },
  { value: "6m", label: "6 mesi", giorni: 182 },
  { value: "1a", label: "1 anno", giorni: 365 },
  { value: "tutto", label: "Tutto", giorni: null },
];

// Tiene i punti degli ultimi N giorni rispetto all'ultimo punto disponibile
// (non a "oggi": se lo storico è fermo da giorni il grafico non resta vuoto).
export function filtraPerIntervallo<T extends { data: string }>(punti: T[], intervallo: IntervalloRapido): T[] {
  const giorni = INTERVALLI_RAPIDI.find((i) => i.value === intervallo)?.giorni ?? null;
  if (giorni === null || punti.length === 0) return punti;
  const ultima = new Date(`${punti[punti.length - 1].data}T00:00:00Z`).getTime();
  const soglia = new Date(ultima - giorni * 86_400_000).toISOString().slice(0, 10);
  return punti.filter((p) => p.data >= soglia);
}
