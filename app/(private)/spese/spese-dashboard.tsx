"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ALTRO_COLOR, categoricalScale, DANGER_COLOR, SEQUENTIAL_BLUE, SUCCESS_COLOR } from "@/lib/chart-colors";
import {
  categoryBreakdown,
  currentAndPreviousWeek,
  formatCurrency,
  weeklyTotals,
} from "@/lib/spese-utils";
import { useIsDark } from "@/lib/use-is-dark";
import type { Categoria, Deposito, Spesa } from "@/lib/types";

const PERIODI = [
  { id: "7", label: "7 giorni", days: 7 },
  { id: "30", label: "30 giorni", days: 30 },
  { id: "90", label: "90 giorni", days: 90 },
  { id: "all", label: "Tutto", days: null },
] as const;

function filterByPeriod<T extends { data: string }>(
  rows: T[],
  days: number | null
): T[] {
  if (days === null) return rows;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  return rows.filter((r) => r.data >= since);
}

export function SpeseDashboard({
  spese,
  categorie,
  depositi,
}: {
  spese: Spesa[];
  categorie: Categoria[];
  depositi: Deposito[];
}) {
  const isDark = useIsDark();
  const [periodo, setPeriodo] = useState<(typeof PERIODI)[number]["id"]>("30");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("tutte");

  const periodoConfig = PERIODI.find((p) => p.id === periodo)!;
  const speseNelPeriodo = useMemo(
    () => filterByPeriod(spese, periodoConfig.days),
    [spese, periodoConfig.days]
  );

  const weekly = useMemo(() => weeklyTotals(spese, 8), [spese]);
  const breakdown = useMemo(() => categoryBreakdown(speseNelPeriodo), [speseNelPeriodo]);
  const { current, deltaPct } = useMemo(
    () => currentAndPreviousWeek(spese),
    [spese]
  );

  const totaleSpesePeriodo = useMemo(
    () => speseNelPeriodo.reduce((s, r) => s + r.importo, 0),
    [speseNelPeriodo]
  );
  const totaleDepositiPeriodo = useMemo(
    () =>
      filterByPeriod(depositi, periodoConfig.days).reduce((s, r) => s + r.importo, 0),
    [depositi, periodoConfig.days]
  );
  const saldoNetto = totaleDepositiPeriodo - totaleSpesePeriodo;

  const palette = categoricalScale(isDark);
  const altro = isDark ? ALTRO_COLOR.dark : ALTRO_COLOR.light;
  const blue = isDark ? SEQUENTIAL_BLUE.dark : SEQUENTIAL_BLUE.light;
  const success = isDark ? SUCCESS_COLOR.dark : SUCCESS_COLOR.light;
  const danger = isDark ? DANGER_COLOR.dark : DANGER_COLOR.light;

  const tableRows = useMemo(() => {
    const rows =
      categoriaFiltro === "tutte"
        ? speseNelPeriodo
        : speseNelPeriodo.filter((s) => s.categoria_id === categoriaFiltro);
    return rows.slice(0, 50);
  }, [speseNelPeriodo, categoriaFiltro]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-2">
        {PERIODI.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriodo(p.id)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              periodo === p.id
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border text-muted hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Spese nel periodo" value={formatCurrency(totaleSpesePeriodo)} />
        <StatTile
          label="Saldo netto nel periodo"
          value={formatCurrency(saldoNetto)}
          valueColor={saldoNetto >= 0 ? success : danger}
        />
        <StatTile
          label="Settimana corrente vs precedente"
          value={formatCurrency(current)}
          delta={deltaPct}
          deltaColor={deltaPct === null ? undefined : deltaPct > 0 ? danger : success}
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted">Andamento settimanale (ultime 8 settimane)</h2>
        <div className="h-64 w-full rounded-lg border border-border bg-surface p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekly} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--muted)", fontSize: 12 }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--foreground)",
                }}
              />
              <Bar dataKey="totale" fill={blue} radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted">Ripartizione per categoria</h2>
        <div className="h-72 w-full rounded-lg border border-border bg-surface p-4">
          {breakdown.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-muted">
              Nessuna spesa nel periodo selezionato.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdown}
                  dataKey="totale"
                  nameKey="nome"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {breakdown.map((entry, i) => (
                    <Cell
                      key={entry.nome}
                      fill={entry.nome === "Altro" ? altro : palette[i % palette.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--foreground)",
                  }}
                />
                <Legend wrapperStyle={{ color: "var(--muted)", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-muted">Spese recenti</h2>
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground"
          >
            <option value="tutte">Tutte le categorie</option>
            {categorie.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Data</th>
                <th className="px-3 py-2 font-medium">Descrizione</th>
                <th className="px-3 py-2 font-medium">Categoria</th>
                <th className="px-3 py-2 text-right font-medium">Importo</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 text-muted">
                    {new Date(`${s.data}T00:00:00Z`).toLocaleDateString("it-IT")}
                  </td>
                  <td className="px-3 py-2">{s.descrizione ?? "—"}</td>
                  <td className="px-3 py-2 text-muted">{s.categoria_nome ?? "—"}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(s.importo)}</td>
                </tr>
              ))}
              {tableRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-muted">
                    Nessuna spesa da mostrare.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  delta,
  valueColor,
  deltaColor,
}: {
  label: string;
  value: string;
  delta?: number | null;
  valueColor?: string;
  deltaColor?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface px-4 py-3">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-xl font-semibold" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </span>
      {delta !== undefined && delta !== null && (
        <span className="text-xs font-medium" style={{ color: deltaColor }}>
          {delta > 0 ? "+" : ""}
          {delta.toFixed(1)}% vs settimana precedente
        </span>
      )}
      {delta === null && <span className="text-xs text-muted">Nessun dato precedente</span>}
    </div>
  );
}
