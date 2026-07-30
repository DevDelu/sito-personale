"use client";

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
  fonteBreakdown,
  fonteLabel,
  formatCurrency,
  monthlyEntrateUscite,
  weeklyNet,
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

const WEEKLY_WINDOWS = [4, 8, 12, 26] as const;
const MONTHLY_WINDOWS = [3, 6, 12] as const;

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

  const fonti = useMemo(() => fonteBreakdown(speseNelPeriodo), [speseNelPeriodo]);
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

  const tableRows = useMemo(() => {
    const rows =
      categoriaFiltro === "tutte"
        ? speseNelPeriodo
        : speseNelPeriodo.filter((s) => s.categoria_id === categoriaFiltro);
    return rows.slice(0, 50);
  }, [speseNelPeriodo, categoriaFiltro]);

  const categoryColor = useMemo(() => {
    const map = new Map<string, string>();
    breakdown.forEach((entry, i) => {
      map.set(entry.nome, entry.nome === "Altro" ? altro : palette[i % palette.length]);
    });
    return map;
  }, [breakdown, palette, altro]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Pills
          options={PERIODI.map((p) => p.id)}
          value={periodo}
          onChange={(id) => setPeriodo(id)}
          formatLabel={(id) => PERIODI.find((p) => p.id === id)!.label}
        />
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
                  <Bar dataKey="totale" isAnimationActive={false} radius={[0, 4, 4, 0]} maxBarSize={22}>
                    {breakdown.map((entry) => (
                      <Cell key={entry.nome} fill={categoryColor.get(entry.nome)} />
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
                    >
                      {breakdown.map((entry) => (
                        <Cell key={entry.nome} fill={categoryColor.get(entry.nome)} />
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
                  <span className="text-lg font-bold">{formatCurrency(totaleSpesePeriodo)}</span>
                  <span className="text-xs text-muted">totale</span>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted">Uscite per fonte</h2>
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
          {fonti.length === 0 ? (
            <p className="text-sm text-muted">Nessuna spesa nel periodo selezionato.</p>
          ) : (
            fonti.map((f) => {
              const max = fonti[0].totale || 1;
              return (
                <div key={f.fonte} className="flex items-center gap-3 text-sm">
                  <span className="w-32 shrink-0 text-muted">{fonteLabel(f.fonte)}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-hover">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(f.totale / max) * 100}%`, background: blue }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right font-medium">
                    {formatCurrency(f.totale)}
                  </span>
                </div>
              );
            })
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
                  <td className="px-3 py-2">
                    {s.titolo ? (
                      <>
                        <span>{s.titolo}</span>
                        {s.descrizione && s.descrizione !== s.titolo && (
                          <span className="text-muted"> — {s.descrizione}</span>
                        )}
                      </>
                    ) : (
                      (s.descrizione ?? "—")
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{
                          background: s.categoria_nome
                            ? (categoryColor.get(s.categoria_nome) ?? "var(--muted)")
                            : "var(--muted)",
                        }}
                      />
                      {s.categoria_nome ?? "—"}
                    </span>
                  </td>
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
