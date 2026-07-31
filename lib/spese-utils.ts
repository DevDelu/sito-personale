import type { Spesa } from "@/lib/types";

type Flow = { data: string; importo: number };

export const currencyFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

export function formatCurrency(n: number): string {
  return currencyFormatter.format(n);
}

export type CategoryShare = { nome: string; totale: number };

export function categoryBreakdown(spese: Spesa[]): CategoryShare[] {
  const totals = new Map<string, number>();
  for (const s of spese) {
    const nome = s.categoria_nome ?? "Senza categoria";
    totals.set(nome, (totals.get(nome) ?? 0) + s.importo);
  }

  return [...totals.entries()]
    .map(([nome, totale]) => ({ nome, totale }))
    .sort((a, b) => b.totale - a.totale);
}

export type CategoriaTotale = { nome: string; colore: string | null; totale: number };

// Fonte unica per "categorie con totale nel periodo, ordinate per importo
// desc": usata dal grafico a torta, dal grafico multi-linea per categoria e
// dal drill-down su singola categoria, per non ricalcolare/duplicare la
// stessa aggregazione in tre punti diversi.
export function categorieOrdinatePerTotale(spese: Spesa[]): CategoriaTotale[] {
  const meta = new Map<string, { colore: string | null; totale: number }>();
  for (const s of spese) {
    const nome = s.categoria_nome ?? "Senza categoria";
    const entry = meta.get(nome) ?? { colore: s.categoria_colore, totale: 0 };
    entry.totale += s.importo;
    meta.set(nome, entry);
  }
  return [...meta.entries()]
    .map(([nome, { colore, totale }]) => ({ nome, colore, totale }))
    .sort((a, b) => b.totale - a.totale);
}

// Densità dei tick dell'asse X: punta sempre a un numero massimo di etichette
// visibili (~maxTicks), indipendentemente da quanti giorni copre il periodo,
// così l'asse resta leggibile sia su 7gg che su un mese o un personalizzato
// lungo (il vecchio "preserveStartEnd" sotto i 45 giorni lasciava sovrapporre
// le etichette su periodi come "mese corrente"). Condivisa da
// DailyTrendChart e CategorySpendingTrendChart.
export function adaptiveTickInterval(pointCount: number, maxTicks = 8): number {
  if (pointCount <= maxTicks) return 0;
  return Math.ceil(pointCount / maxTicks) - 1;
}

export type DailyPoint = { data: string; label: string; entrate: number; uscite: number };

export function dailyFlow(spese: Flow[], depositi: Flow[], from: string, to: string): DailyPoint[] {
  const uscite = new Map<string, number>();
  for (const s of spese) uscite.set(s.data, (uscite.get(s.data) ?? 0) + s.importo);

  const entrate = new Map<string, number>();
  for (const d of depositi) entrate.set(d.data, (entrate.get(d.data) ?? 0) + d.importo);

  const points: DailyPoint[] = [];
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);

  for (let d = start; d <= end; d = new Date(d.getTime() + 24 * 60 * 60 * 1000)) {
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" });
    points.push({ data: key, label, entrate: entrate.get(key) ?? 0, uscite: uscite.get(key) ?? 0 });
  }

  return points;
}
