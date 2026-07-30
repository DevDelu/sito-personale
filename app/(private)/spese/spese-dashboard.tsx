"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import {
  Area,
  AreaChart,
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
import { categoryBreakdown, dailyFlow, formatCurrency } from "@/lib/spese-utils";
import { categoryColor } from "@/lib/category-style";
import { CategoryBadge } from "@/components/category-badge";
import type { Categoria, Deposito, Spesa } from "@/lib/types";

const PRESETS = [
  { id: "7", label: "7 giorni" },
  { id: "30", label: "30 giorni" },
  { id: "90", label: "90 giorni" },
] as const;

const chartTooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  color: "var(--foreground)",
  fontFamily: "var(--font-sans)",
};

const axisTick = { fill: "var(--muted)", fontSize: 12, fontFamily: "var(--font-mono)" };

type Range = { from: string; to: string; preset: string | null };

function clickedNome(entry: unknown): string | null {
  const e = entry as { nome?: unknown; payload?: { nome?: unknown } };
  const nome = e.payload?.nome ?? e.nome;
  return typeof nome === "string" ? nome : null;
}

function RangeSelector({ range }: { range: Range }) {
  const router = useRouter();
  const [showCustom, setShowCustom] = useState(range.preset === null);
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => {
            setShowCustom(false);
            router.push(`/spese?preset=${p.id}`);
          }}
          className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
            range.preset === p.id
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border text-muted hover:text-foreground"
          }`}
        >
          {p.label}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setShowCustom((v) => !v)}
        className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
          range.preset === null
            ? "border-accent bg-accent text-accent-foreground"
            : "border-border text-muted hover:text-foreground"
        }`}
      >
        Personalizzato
      </button>
      {showCustom && (
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/spese?from=${from}&to=${to}`);
          }}
        >
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-xl border border-border bg-surface px-2 py-1.5 text-sm text-foreground"
          />
          <span className="text-muted">–</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-xl border border-border bg-surface px-2 py-1.5 text-sm text-foreground"
          />
          <button
            type="submit"
            className="rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground"
          >
            Applica
          </button>
        </form>
      )}
    </div>
  );
}

export function SpeseDashboard({
  spese,
  categorie,
  depositi,
  range,
}: {
  spese: Spesa[];
  categorie: Categoria[];
  depositi: Deposito[];
  range: Range;
}) {
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("tutte");
  const [categoriaFiltroEntrate, setCategoriaFiltroEntrate] = useState<string>("tutte");

  const daily = useMemo(
    () => dailyFlow(spese, depositi, range.from, range.to),
    [spese, depositi, range.from, range.to]
  );
  const breakdown = useMemo(() => categoryBreakdown(spese), [spese]);

  const totaleSpese = useMemo(() => spese.reduce((s, r) => s + r.importo, 0), [spese]);
  const totaleEntrate = useMemo(() => depositi.reduce((s, r) => s + r.importo, 0), [depositi]);
  const saldoNetto = totaleEntrate - totaleSpese;

  const speseTableRows = useMemo(
    () =>
      (categoriaFiltro === "tutte"
        ? spese
        : spese.filter((s) => s.categoria_nome === categoriaFiltro)
      ).slice(0, 50),
    [spese, categoriaFiltro]
  );
  const entrateTableRows = useMemo(
    () =>
      (categoriaFiltroEntrate === "tutte"
        ? depositi
        : depositi.filter((d) => d.categoria_nome === categoriaFiltroEntrate)
      ).slice(0, 50),
    [depositi, categoriaFiltroEntrate]
  );

  const categorieSpesa = useMemo(() => categorie.filter((c) => c.tipo === "spesa"), [categorie]);
  const categorieEntrata = useMemo(
    () => categorie.filter((c) => c.tipo === "entrata"),
    [categorie]
  );

  function toggleCategoriaFiltro(nome: string) {
    setCategoriaFiltro((prev) => (prev === nome ? "tutte" : nome));
  }

  const tickInterval = daily.length > 45 ? Math.ceil(daily.length / 12) : "preserveStartEnd";

  return (
    <div className="flex flex-col gap-8">
      <RangeSelector range={range} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Entrate nel periodo" value={totaleEntrate} colorVar="--entrata" />
        <StatTile label="Uscite nel periodo" value={totaleSpese} colorVar="--spesa" />
        <StatTile
          label="Saldo netto nel periodo"
          value={saldoNetto}
          colorVar={saldoNetto >= 0 ? "--entrata" : "--spesa"}
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-medium text-muted">Andamento giornaliero</h2>
        <div className="h-72 w-full rounded-xl border border-border bg-surface p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="entrateFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--entrata)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--entrata)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="usciteFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--spesa)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--spesa)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />
              <XAxis
                dataKey="label"
                tick={axisTick}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
                interval={tickInterval}
              />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} width={56} />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={chartTooltipStyle}
              />
              <Legend wrapperStyle={{ color: "var(--muted)", fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="entrate"
                name="Entrate"
                isAnimationActive={false}
                stroke="var(--entrata)"
                strokeWidth={2}
                fill="url(#entrateFill)"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="uscite"
                name="Uscite"
                isAnimationActive={false}
                stroke="var(--spesa)"
                strokeWidth={2}
                fill="url(#usciteFill)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-medium text-muted">Spese per categoria</h2>
        <p className="text-xs text-muted">Clicca una fetta per filtrare la tabella spese.</p>
        <div className="relative h-72 w-full rounded-xl border border-border bg-surface p-4">
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
                        fill={categoryColor(entry.nome)}
                        opacity={
                          categoriaFiltro === "tutte" || categoriaFiltro === entry.nome ? 1 : 0.35
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
                <span className="font-figures text-lg font-bold">
                  {formatCurrency(
                    categoriaFiltro === "tutte"
                      ? totaleSpese
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

      <TransactionTable
        title="Spese"
        rows={speseTableRows}
        categorie={categorieSpesa}
        categoriaFiltro={categoriaFiltro}
        onCategoriaFiltroChange={setCategoriaFiltro}
        emptyLabel="Nessuna spesa da mostrare."
      />

      <TransactionTable
        title="Entrate"
        rows={entrateTableRows}
        categorie={categorieEntrata}
        categoriaFiltro={categoriaFiltroEntrate}
        onCategoriaFiltroChange={setCategoriaFiltroEntrate}
        emptyLabel="Nessuna entrata da mostrare."
      />
    </div>
  );
}

function TransactionTable({
  title,
  rows,
  categorie,
  categoriaFiltro,
  onCategoriaFiltroChange,
  emptyLabel,
}: {
  title: string;
  rows: (Spesa | Deposito)[];
  categorie: Categoria[];
  categoriaFiltro: string;
  onCategoriaFiltroChange: (v: string) => void;
  emptyLabel: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-sm font-medium text-muted">{title}</h2>
        <select
          value={categoriaFiltro}
          onChange={(e) => onCategoriaFiltroChange(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-1.5 text-sm text-foreground"
        >
          <option value="tutte">Tutte le categorie</option>
          {categorie.map((c) => (
            <option key={c.id} value={c.nome}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
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
            {rows.map((r) => {
              const extra =
                r.categoria_nome === "Bonifici" && r.nominativo
                  ? r.nominativo
                  : r.categoria_nome === "PayPal" && r.dettaglio
                    ? r.dettaglio
                    : null;
              return (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 whitespace-nowrap text-muted">
                    {new Date(`${r.data}T00:00:00Z`).toLocaleDateString("it-IT")}
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1.5">
                      {r.fonte === "manuale" && (
                        <Pencil className="h-3 w-3 shrink-0 text-muted" aria-label="Inserito manualmente" />
                      )}
                      <span>{r.titolo ?? r.descrizione ?? "—"}</span>
                    </span>
                    {extra && <div className="text-xs text-muted">{extra}</div>}
                    {r.titolo && r.descrizione && r.descrizione !== r.titolo && (
                      <div className="text-xs text-muted">{r.descrizione}</div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <CategoryBadge nome={r.categoria_nome} />
                  </td>
                  <td className="px-3 py-2 text-right font-figures">{formatCurrency(r.importo)}</td>
                </tr>
              );
            })}
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

function StatTile({
  label,
  value,
  colorVar,
}: {
  label: string;
  value: number;
  colorVar: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-surface px-4 py-3">
      <span className="text-xs text-muted">{label}</span>
      <span className="font-figures text-2xl font-semibold" style={{ color: `var(${colorVar})` }}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}
