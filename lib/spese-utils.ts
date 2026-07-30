import { mondayOf } from "@/lib/csv";
import type { Deposito, Spesa } from "@/lib/types";

type Flow = { data: string; importo: number };

export const currencyFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

export function formatCurrency(n: number): string {
  return currencyFormatter.format(n);
}

export type WeeklyPoint = { settimana: string; label: string; totale: number };

export function weeklyTotals(rows: Flow[], weeks = 8): WeeklyPoint[] {
  const totals = new Map<string, number>();
  for (const r of rows) {
    const key = mondayOf(r.data);
    totals.set(key, (totals.get(key) ?? 0) + r.importo);
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

export function weeklyNet(speseRows: Flow[], depositiRows: Flow[], weeks = 12): WeeklyPoint[] {
  const uscite = weeklyTotals(speseRows, weeks);
  const entrate = weeklyTotals(depositiRows, weeks);
  return uscite.map((u, i) => ({
    settimana: u.settimana,
    label: u.label,
    totale: entrate[i].totale - u.totale,
  }));
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

export function currentAndPreviousWeek(rows: Flow[]) {
  const currentWeek = mondayOf(new Date().toISOString().slice(0, 10));
  const prevDate = new Date(`${currentWeek}T00:00:00Z`);
  prevDate.setUTCDate(prevDate.getUTCDate() - 7);
  const previousWeek = prevDate.toISOString().slice(0, 10);

  let current = 0;
  let previous = 0;
  for (const r of rows) {
    const key = mondayOf(r.data);
    if (key === currentWeek) current += r.importo;
    else if (key === previousWeek) previous += r.importo;
  }

  const deltaPct = previous === 0 ? null : ((current - previous) / previous) * 100;

  return { current, previous, deltaPct };
}

export type MonthlyFlow = { mese: string; label: string; entrate: number; uscite: number };

export function monthlyEntrateUscite(
  spese: Spesa[],
  depositi: Deposito[],
  months = 6
): MonthlyFlow[] {
  const uscite = new Map<string, number>();
  for (const s of spese) {
    const key = s.data.slice(0, 7); // YYYY-MM
    uscite.set(key, (uscite.get(key) ?? 0) + s.importo);
  }

  const entrate = new Map<string, number>();
  for (const d of depositi) {
    const key = d.data.slice(0, 7);
    entrate.set(key, (entrate.get(key) ?? 0) + d.importo);
  }

  const points: MonthlyFlow[] = [];
  const today = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getFullYear(), today.getMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("it-IT", { month: "short", year: "2-digit" });
    points.push({
      mese: key,
      label,
      entrate: entrate.get(key) ?? 0,
      uscite: uscite.get(key) ?? 0,
    });
  }

  return points;
}

