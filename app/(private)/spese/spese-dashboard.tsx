"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ALTRO_COLOR,
  categoricalScale,
  DANGER_COLOR,
  SEQUENTIAL_BLUE,
  SUCCESS_COLOR,
} from "@/lib/chart-colors";
import {
  categoryBreakdown,
  currentAndPreviousWeek,
  formatCurrency,
  monthlyEntrateUscite,
  weeklyNet,
  weeklyTotals,
} from "@/lib/spese-utils";
import { useIsDark } from "@/lib/use-is-dark";
import { accettaSuggerimento } from "./actions";
import type { Categoria, Deposito, Spesa } from "@/lib/types";

const PERIODI = [
  { id: "7", label: "7 giorni", days: 7 },
  { id: "30", label: "30 giorni", days: 30 },
  { id: "90", label: "90 giorni", days: 90 },
  { id: "all", label: "Tutto", days: null },
] as const;

const WEEKLY_WINDOWS = [4, 8, 12, 26] as const;
const MONTHLY_WINDOWS = [3, 6, 12] as const;

function clickedNome(entry: unknown): string | null {
  const e = entry as { nome?: unknown; payload?: { nome?: unknown } };
  const nome = e.payload?.nome ?? e.nome;
  return typeof nome === "string" ? nome : null;
}

function filterByPeriod<T extends { data: string }>(rows: T[], days: number | null): T[] {
  if (days === null) return rows;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return rows.filter((r) => r.data >= since);
}

function Pills<T extends string | number>({
  options,
  value,
  onChange,
  formatLabel,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  formatLabel: (v: T) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
            value === opt
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border text-muted hover:text-foreground"
          }`}
        >
          {formatLabel(opt)}
        </button>
      ))}
    </div>
  );
}

const chartTooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--foreground)",
};

const axisTick = { fill: "var(--muted)", fontSize: 12 };

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
  const [categoriaFiltroEntrate, setCategoriaFiltroEntrate] = useState<string>("tutte");
  const [weeklyWindow, setWeeklyWindow] = useState<(typeof WEEKLY_WINDOWS)[number]>(8);
  const [monthlyWindow, setMonthlyWindow] = useState<(typeof MONTHLY_WINDOWS)[number]>(6);

  const periodoConfig = PERIODI.find((p) => p.id === periodo)!;
  const speseNelPeriodo = useMemo(
    () => filterByPeriod(spese, periodoConfig.days),
    [spese, periodoConfig.days]
  );
  const depositiNelPeriodo = useMemo(
    () => filterByPeriod(depositi, periodoConfig.days),
    [depositi, periodoConfig.days]
  );

  const weekly = useMemo(() => weeklyTotals(spese, weeklyWindow), [spese, weeklyWindow]);
  const monthly = useMemo(
    () => monthlyEntrateUscite(spese, depositi, monthlyWindow),
    [spese, depositi, monthlyWindow]
  );
  const netSpark = useMemo(() => weeklyNet(spese, depositi, 12), [spese, depositi]);
  const usciteSpark = useMemo(() => weeklyTotals(spese, 12), [spese]);
  const entrateSpark = useMemo(() => weeklyTotals(depositi, 12), [depositi]);

  const breakdown = useMemo(() => categoryBreakdown(speseNelPeriodo), [speseNelPeriodo]);
  const { current, deltaPct } = useMemo(() => currentAndPreviousWeek(spese), [spese]);

  const totaleSpesePeriodo = useMemo(
    () => speseNelPeriodo.reduce((s, r) => s + r.importo, 0),
    [speseNelPeriodo]
  );
  const totaleDepositiPeriodo = useMemo(
    () => depositiNelPeriodo.reduce((s, r) => s + r.importo, 0),
    [depositiNelPeriodo]
  );
  const saldoNetto = totaleDepositiPeriodo - totaleSpesePeriodo;

  const palette = categoricalScale(isDark);
  const altro = isDark ? ALTRO_COLOR.dark : ALTRO_COLOR.light;
  const blue = isDark ? SEQUENTIAL_BLUE.dark : SEQUENTIAL_BLUE.light;
  const success = isDark ? SUCCESS_COLOR.dark : SUCCESS_COLOR.light;
  const danger = isDark ? DANGER_COLOR.dark : DANGER_COLOR.light;

  const speseTableRows = useMemo(() => {
    const rows =
      categoriaFiltro === "tutte"
        ? speseNelPeriodo
        : speseNelPeriodo.filter((s) => s.categoria_nome === categoriaFiltro);
    return rows.slice(0, 50);
  }, [speseNelPeriodo, categoriaFiltro]);

  const entrateTableRows = useMemo(() => {
    const rows =
      categoriaFiltroEntrate === "tutte"
        ? depositiNelPeriodo
        : depositiNelPeriodo.filter((d) => d.categoria_nome === categoriaFiltroEntrate);
    return rows.slice(0, 50);
  }, [depositiNelPeriodo, categoriaFiltroEntrate]);

  const categorieSpesa = useMemo(() => categorie.filter((c) => c.tipo === "spesa"), [categorie]);
  const categorieEntrata = useMemo(
    () => categorie.filter((c) => c.tipo === "entrata"),
    [categorie]
  );

  const categoryColor = useMemo(() => {
    const map = new Map<string, string>();
    breakdown.forEach((entry, i) => {
      map.set(entry.nome, entry.nome === "Altro" ? altro : palette[i % palette.length]);
    });
    return map;
  }, [breakdown, palette, altro]);

  function toggleCategoriaFiltro(nome: string) {
    setCategoriaFiltro((prev) => (prev === nome ? "tutte" : nome));
  }

  return (
    <div className="flex flex-col gap-8 pb-20 md:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Pills
          options={PERIODI.map((p) => p.id)}
          value={periodo}
          onChange={(id) => setPeriodo(id)}
          formatLabel={(id) => PERIODI.find((p) => p.id === id)!.label}
        />
        <Link
          href="/spese/nuovo"
          className="hidden rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 md:inline-flex"
        >
          + Aggiungi movimento
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={<IconArrowDownCircle />}
          label="Entrate nel periodo"
          value={formatCurrency(totaleDepositiPeriodo)}
          sparkline={entrateSpark.map((p) => p.totale)}
          sparkColor={success}
        />
        <StatTile
          icon={<IconArrowUpCircle />}
          label="Uscite nel periodo"
          value={formatCurrency(totaleSpesePeriodo)}
          sparkline={usciteSpark.map((p) => p.totale)}
          sparkColor={danger}
        />
        <StatTile
          icon={<IconScale />}
          label="Saldo netto nel periodo"
          value={formatCurrency(saldoNetto)}
          valueColor={saldoNetto >= 0 ? success : danger}
          sparkline={netSpark.map((p) => p.totale)}
          sparkColor={saldoNetto >= 0 ? success : danger}
        />
        <StatTile
          icon={<IconCalendar />}
          label="Settimana corrente vs precedente"
          value={formatCurrency(current)}
          delta={deltaPct}
          deltaColor={deltaPct === null ? undefined : deltaPct > 0 ? danger : success}
        />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-muted">Andamento settimanale</h2>
          <Pills
            options={WEEKLY_WINDOWS}
            value={weeklyWindow}
            onChange={setWeeklyWindow}
            formatLabel={(w) => `${w} sett.`}
          />
        </div>
        <div className="h-64 w-full rounded-lg border border-border bg-surface p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weekly} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="weeklyFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={blue} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />
              <XAxis
                dataKey="label"
                tick={axisTick}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} width={48} />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={chartTooltipStyle}
              />
              <Area
                type="monotone"
                dataKey="totale"
                isAnimationActive={false}
                stroke={blue}
                strokeWidth={2}
                fill="url(#weeklyFill)"
                dot={{ r: 3, fill: blue, stroke: "var(--surface)", strokeWidth: 1.5 }}
                activeDot={{ r: 5, fill: blue, stroke: "var(--surface)", strokeWidth: 2 }}
              >
                <LabelList
                  dataKey="totale"
                  content={(props) => (
                    <EndLabel {...props} total={weekly.length} color="var(--foreground)" />
                  )}
                />
              </Area>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-muted">Entrate vs uscite</h2>
          <Pills
            options={MONTHLY_WINDOWS}
            value={monthlyWindow}
            onChange={setMonthlyWindow}
            formatLabel={(m) => `${m} mesi`}
          />
        </div>
        <div className="h-64 w-full rounded-lg border border-border bg-surface p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly} barCategoryGap="30%" barGap={2}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />
              <XAxis
                dataKey="label"
                tick={axisTick}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} width={48} />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={chartTooltipStyle}
              />
              <Legend wrapperStyle={{ color: "var(--muted)", fontSize: 12 }} />
              <Bar
                dataKey="entrate"
                name="Entrate"
                isAnimationActive={false}
                fill={success}
                radius={[4, 4, 0, 0]}
                maxBarSize={20}
              />
              <Bar
                dataKey="uscite"
                name="Uscite"
                isAnimationActive={false}
                fill={danger}
                radius={[4, 4, 0, 0]}
                maxBarSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted">Top categorie di spesa</h2>
          <div
            className="w-full rounded-lg border border-border bg-surface p-4"
            style={{ height: Math.max(220, breakdown.length * 40) }}
          >
            {breakdown.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-muted">
                Nessuna spesa nel periodo selezionato.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={breakdown}
                  layout="vertical"
                  margin={{ top: 4, right: 56, left: 4, bottom: 4 }}
                >
                  <CartesianGrid horizontal={false} stroke="var(--border)" strokeWidth={1} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="nome"
                    width={130}
                    tick={axisTick}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={chartTooltipStyle}
                    cursor={{ fill: "var(--surface-hover)" }}
                  />
                  <Bar
                    dataKey="totale"
                    isAnimationActive={false}
                    radius={[0, 4, 4, 0]}
                    maxBarSize={22}
                    cursor="pointer"
                    onClick={(entry) => {
                      const nome = clickedNome(entry);
                      if (nome) toggleCategoriaFiltro(nome);
                    }}
                  >
                    {breakdown.map((entry) => (
                      <Cell
                        key={entry.nome}
                        fill={categoryColor.get(entry.nome)}
                        opacity={
                          categoriaFiltro === "tutte" || categoriaFiltro === entry.nome ? 1 : 0.35
                        }
                      />
                    ))}
                    <LabelList
                      dataKey="totale"
                      position="right"
                      formatter={(v) => (typeof v === "number" ? formatCurrency(v) : "")}
                      style={{ fill: "var(--foreground)", fontSize: 12, fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted">Ripartizione per categoria</h2>
          <p className="text-xs text-muted">Clicca una fetta per filtrare la tabella spese.</p>
          <div className="relative h-72 w-full rounded-lg border border-border bg-surface p-4">
            {breakdown.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-muted">
                Nessuna spesa nel periodo selezionato.
              </p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={breakdown}
                      dataKey="totale"
                      nameKey="nome"
                      isAnimationActive={false}
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      cursor="pointer"
                      onClick={(entry) => {
                      const nome = clickedNome(entry);
                      if (nome) toggleCategoriaFiltro(nome);
                    }}
                    >
                      {breakdown.map((entry) => (
                        <Cell
                          key={entry.nome}
                          fill={categoryColor.get(entry.nome)}
                          opacity={
                            categoriaFiltro === "tutte" || categoriaFiltro === entry.nome
                              ? 1
                              : 0.35
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={chartTooltipStyle}
                    />
                    <Legend wrapperStyle={{ color: "var(--muted)", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-10">
                  <span className="text-lg font-bold">
                    {formatCurrency(
                      categoriaFiltro === "tutte"
                        ? totaleSpesePeriodo
                        : (breakdown.find((b) => b.nome === categoriaFiltro)?.totale ?? 0)
                    )}
                  </span>
                  <span className="text-xs text-muted">
                    {categoriaFiltro === "tutte" ? "totale" : categoriaFiltro}
                  </span>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      <TransactionTable
        title="Spese recenti"
        rows={speseTableRows}
        categorie={categorieSpesa}
        categoriaFiltro={categoriaFiltro}
        onCategoriaFiltroChange={setCategoriaFiltro}
        categoryColor={categoryColor}
        tabella="spese"
        emptyLabel="Nessuna spesa da mostrare."
      />

      <TransactionTable
        title="Entrate recenti"
        rows={entrateTableRows}
        categorie={categorieEntrata}
        categoriaFiltro={categoriaFiltroEntrate}
        onCategoriaFiltroChange={setCategoriaFiltroEntrate}
        categoryColor={null}
        tabella="depositi"
        emptyLabel="Nessuna entrata da mostrare."
      />

      <Link
        href="/spese/nuovo"
        aria-label="Aggiungi movimento"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-opacity hover:opacity-90 md:hidden"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </Link>
    </div>
  );
}

function TransactionTable({
  title,
  rows,
  categorie,
  categoriaFiltro,
  onCategoriaFiltroChange,
  categoryColor,
  tabella,
  emptyLabel,
}: {
  title: string;
  rows: (Spesa | Deposito)[];
  categorie: Categoria[];
  categoriaFiltro: string;
  onCategoriaFiltroChange: (v: string) => void;
  categoryColor: Map<string, string> | null;
  tabella: "spese" | "depositi";
  emptyLabel: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-muted">{title}</h2>
        <select
          value={categoriaFiltro}
          onChange={(e) => onCategoriaFiltroChange(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground"
        >
          <option value="tutte">Tutte le categorie</option>
          {categorie.map((c) => (
            <option key={c.id} value={c.nome}>
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
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2 text-muted">
                  {new Date(`${r.data}T00:00:00Z`).toLocaleDateString("it-IT")}
                </td>
                <td className="px-3 py-2">
                  {r.titolo ? (
                    <>
                      <span>{r.titolo}</span>
                      {r.descrizione && r.descrizione !== r.titolo && (
                        <span className="text-muted"> — {r.descrizione}</span>
                      )}
                    </>
                  ) : (
                    (r.descrizione ?? "—")
                  )}
                </td>
                <td className="px-3 py-2 text-muted">
                  <div className="flex flex-col gap-1">
                    <span className="inline-flex items-center gap-2">
                      {categoryColor && (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{
                            background: r.categoria_nome
                              ? (categoryColor.get(r.categoria_nome) ?? "var(--muted)")
                              : "var(--muted)",
                          }}
                        />
                      )}
                      {r.categoria_nome ?? "—"}
                    </span>
                    {r.categoria_suggerita && (
                      <form action={accettaSuggerimento.bind(null, tabella, r.id)}>
                        <button
                          type="submit"
                          className="inline-flex w-fit items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs text-accent transition-colors hover:bg-accent/20"
                        >
                          <IconSparkle />
                          suggerito: {r.categoria_suggerita}
                        </button>
                      </form>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 text-right">{formatCurrency(r.importo)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted">
                  {emptyLabel}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EndLabel({
  x,
  y,
  index,
  value,
  total,
  color,
}: {
  x?: string | number;
  y?: string | number;
  index?: number;
  value?: unknown;
  total: number;
  color: string;
}) {
  if (
    index !== total - 1 ||
    x === undefined ||
    y === undefined ||
    typeof value !== "number"
  ) {
    return null;
  }
  return (
    <text x={x} y={Number(y) - 12} textAnchor="middle" fontSize={12} fontWeight={600} fill={color}>
      {formatCurrency(value)}
    </text>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const width = 72;
  const height = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return [x, y] as const;
  });
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg width={width} height={height} className="shrink-0" aria-hidden>
      <path d={path} fill="none" stroke="var(--muted)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r={2.5} fill={color} stroke="var(--surface)" strokeWidth={1} />
    </svg>
  );
}

function StatTile({
  icon,
  label,
  value,
  delta,
  valueColor,
  deltaColor,
  sparkline,
  sparkColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: number | null;
  valueColor?: string;
  deltaColor?: string;
  sparkline?: number[];
  sparkColor?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface px-4 py-3">
      <div className="flex items-center gap-2 text-muted">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span
            className="text-xl font-semibold"
            style={valueColor ? { color: valueColor } : undefined}
          >
            {value}
          </span>
          {delta !== undefined && delta !== null && (
            <span className="text-xs font-medium" style={{ color: deltaColor }}>
              {delta > 0 ? "+" : ""}
              {delta.toFixed(1)}% vs sett. prec.
            </span>
          )}
          {delta === null && <span className="text-xs text-muted">Nessun dato precedente</span>}
        </div>
        {sparkline && sparkColor && <Sparkline data={sparkline} color={sparkColor} />}
      </div>
    </div>
  );
}

function IconArrowDownCircle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v7M8.5 11.5 12 15l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconArrowUpCircle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 17v-7M8.5 12.5 12 9l3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconScale() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M12 3v18M7 21h10M5 7l-3 6a3 3 0 0 0 6 0l-3-6ZM19 7l-3 6a3 3 0 0 0 6 0l-3-6ZM5 7h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  );
}

function IconSparkle() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
      <path d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2Z" />
    </svg>
  );
}
