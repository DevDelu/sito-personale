"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import { resolveCategoryColor } from "@/lib/category-style";
import { adaptiveTickInterval, categorieOrdinatePerTotale, formatCurrency } from "@/lib/spese-utils";
import type { Spesa } from "@/lib/types";

const axisTick = { fill: "var(--muted)", fontSize: 12, fontFamily: "var(--font-mono)" };

function buildSerieCategoria(
  spese: Spesa[],
  categoria: string,
  from: string,
  to: string
): { label: string; valore: number }[] {
  const totaliPerGiorno = new Map<string, number>();
  for (const s of spese) {
    const nome = s.categoria_nome ?? "Senza categoria";
    if (nome !== categoria) continue;
    totaliPerGiorno.set(s.data, (totaliPerGiorno.get(s.data) ?? 0) + s.importo);
  }

  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  const data: { label: string; valore: number }[] = [];
  for (let d = start; d <= end; d = new Date(d.getTime() + 24 * 60 * 60 * 1000)) {
    const key = d.toISOString().slice(0, 10);
    data.push({
      label: d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }),
      valore: totaliPerGiorno.get(key) ?? 0,
    });
  }
  return data;
}

type DrilldownTooltipProps = Partial<TooltipContentProps<number, string>> & { colore: string };

function DrilldownTooltip({ active, payload, label, colore }: DrilldownTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const valore = payload[0]?.value as number | undefined;
  if (typeof valore !== "number") return null;

  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-display text-sm font-semibold">{label}</div>
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colore }} />
        <span className="font-figures">{formatCurrency(valore)}</span>
      </div>
    </div>
  );
}

// Vista di dettaglio su UNA categoria alla volta (in aggiunta al grafico
// multi-linea "Andamento per categoria", che resta invariato): utile quando
// si vuole isolare l'andamento di una singola categoria senza le altre linee
// sovrapposte. Stessa fonte colori (resolveCategoryColor) e stessa
// aggregazione categorie (categorieOrdinatePerTotale) del resto dei grafici.
export function CategoryDrilldownChart({
  spese,
  from,
  to,
}: {
  spese: Spesa[];
  from: string;
  to: string;
}) {
  const categorie = useMemo(() => categorieOrdinatePerTotale(spese), [spese]);
  const [categoriaSelezionata, setCategoriaSelezionata] = useState<string | null>(null);
  const [prevCategorie, setPrevCategorie] = useState(categorie);

  if (categorie !== prevCategorie) setPrevCategorie(categorie);

  // Se la categoria scelta non esiste più nel periodo filtrato (o non è
  // stata ancora scelta), ricade sulla prima per totale.
  const categoriaAttiva =
    categoriaSelezionata && categorie.some((c) => c.nome === categoriaSelezionata)
      ? categoriaSelezionata
      : (categorie[0]?.nome ?? null);

  const meta = categorie.find((c) => c.nome === categoriaAttiva);
  const colore = meta ? resolveCategoryColor(meta.nome, meta.colore) : "var(--muted)";

  const data = useMemo(
    () => (categoriaAttiva ? buildSerieCategoria(spese, categoriaAttiva, from, to) : []),
    [spese, categoriaAttiva, from, to]
  );
  const tickInterval = adaptiveTickInterval(data.length);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <select
          value={categoriaAttiva ?? ""}
          onChange={(e) => setCategoriaSelezionata(e.target.value)}
          disabled={categorie.length === 0}
          className="rounded-xl border border-border bg-surface px-3 py-1.5 text-sm text-foreground disabled:opacity-50"
        >
          {categorie.length === 0 && <option value="">Nessuna categoria</option>}
          {categorie.map((c) => (
            <option key={c.nome} value={c.nome}>
              {c.nome}
            </option>
          ))}
        </select>
        {meta && (
          <span className="font-figures text-sm font-semibold" style={{ color: colore }}>
            {formatCurrency(meta.totale)} nel periodo
          </span>
        )}
      </div>

      <div className="h-64 w-full rounded-xl border border-border bg-surface p-4">
        {categorie.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted">
            Nessuna spesa nel periodo selezionato.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="drilldownFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colore} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={colore} stopOpacity={0} />
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
              <Tooltip content={<DrilldownTooltip colore={colore} />} />
              <Area
                type="monotone"
                dataKey="valore"
                isAnimationActive={false}
                stroke={colore}
                strokeWidth={2}
                fill="url(#drilldownFill)"
                dot={false}
                activeDot={{ r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
