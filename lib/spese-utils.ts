import { mondayOf } from "@/lib/csv";
import type { Spesa } from "@/lib/types";

export const currencyFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

export function formatCurrency(n: number): string {
  return currencyFormatter.format(n);
}

export type WeeklyPoint = { settimana: string; label: string; totale: number };

export function weeklyTotals(spese: Spesa[], weeks = 8): WeeklyPoint[] {
  const totals = new Map<string, number>();
  for (const s of spese) {
    const key = s.settimana_riferimento ?? mondayOf(s.data);
    totals.set(key, (totals.get(key) ?? 0) + s.importo);
  }

  const points: WeeklyPoint[] = [];
  const today = mondayOf(new Date().toISOString().slice(0, 10));

  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(`${today}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - i * 7);
    const key = d.toISOString().slice(0, 10);
    const label = new Date(`${key}T00:00:00Z`).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
    });
    points.push({ settimana: key, label, totale: totals.get(key) ?? 0 });
  }

  return points;
}

export type CategoryShare = { nome: string; totale: number };

const MAX_CATEGORY_SLICES = 7;

export function categoryBreakdown(spese: Spesa[]): CategoryShare[] {
  const totals = new Map<string, number>();
  for (const s of spese) {
    const nome = s.categoria_nome ?? "Senza categoria";
    totals.set(nome, (totals.get(nome) ?? 0) + s.importo);
  }

  const sorted = [...totals.entries()]
    .map(([nome, totale]) => ({ nome, totale }))
    .sort((a, b) => b.totale - a.totale);

  if (sorted.length <= MAX_CATEGORY_SLICES) return sorted;

  const top = sorted.slice(0, MAX_CATEGORY_SLICES);
  const altro = sorted
    .slice(MAX_CATEGORY_SLICES)
    .reduce((sum, c) => sum + c.totale, 0);

  return [...top, { nome: "Altro", totale: altro }];
}

export function currentAndPreviousWeek(spese: Spesa[]) {
  const currentWeek = mondayOf(new Date().toISOString().slice(0, 10));
  const prevDate = new Date(`${currentWeek}T00:00:00Z`);
  prevDate.setUTCDate(prevDate.getUTCDate() - 7);
  const previousWeek = prevDate.toISOString().slice(0, 10);

  let current = 0;
  let previous = 0;
  for (const s of spese) {
    const key = s.settimana_riferimento ?? mondayOf(s.data);
    if (key === currentWeek) current += s.importo;
    else if (key === previousWeek) previous += s.importo;
  }

  const deltaPct = previous === 0 ? null : ((current - previous) / previous) * 100;

  return { current, previous, deltaPct };
}
