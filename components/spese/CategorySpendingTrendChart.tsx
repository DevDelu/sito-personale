"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import { resolveCategoryColor } from "@/lib/category-style";
import {
  adaptiveTickInterval,
  categorieOrdinatePerTotale,
  formatCurrency,
  type CategoriaTotale,
} from "@/lib/spese-utils";
import type { Spesa } from "@/lib/types";

const axisTick = { fill: "var(--muted)", fontSize: 12, fontFamily: "var(--font-mono)" };

// Oltre questa soglia, solo le prime N categorie per totale nel periodo sono
// visibili di default (le altre restano disattivabili/attivabili dalla
// legenda): evita un grafico illeggibile con troppe linee sovrapposte.
const MAX_VISIBILI_DEFAULT = 6;

type PuntoGiorno = Record<string, string | number>;

function buildSerie(
  spese: Spesa[],
  from: string,
  to: string
): { data: PuntoGiorno[]; categorie: CategoriaTotale[] } {
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  const giorni: { data: string; label: string }[] = [];
  for (let d = start; d <= end; d = new Date(d.getTime() + 24 * 60 * 60 * 1000)) {
    const key = d.toISOString().slice(0, 10);
    giorni.push({ data: key, label: d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }) });
  }

  const categorie = categorieOrdinatePerTotale(spese);

  const totalePerGiorno = new Map<string, Map<string, number>>();
  for (const s of spese) {
    const nome = s.categoria_nome ?? "Senza categoria";
    const perGiorno = totalePerGiorno.get(s.data) ?? new Map<string, number>();
    perGiorno.set(nome, (perGiorno.get(nome) ?? 0) + s.importo);
    totalePerGiorno.set(s.data, perGiorno);
  }

  const data = giorni.map((giorno) => {
    const perGiorno = totalePerGiorno.get(giorno.data);
    const punto: PuntoGiorno = { data: giorno.data, label: giorno.label };
    for (const cat of categorie) punto[cat.nome] = perGiorno?.get(cat.nome) ?? 0;
    return punto;
  });

  return { data, categorie };
}

function defaultNascoste(categorie: CategoriaTotale[]): Set<string> {
  if (categorie.length <= MAX_VISIBILI_DEFAULT) return new Set();
  return new Set(categorie.slice(MAX_VISIBILI_DEFAULT).map((c) => c.nome));
}

type TrendTooltipProps = Partial<TooltipContentProps<number, string>>;

function CategoryTrendTooltip({ active, payload, label }: TrendTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const voci = payload.filter((p) => typeof p.value === "number" && p.value > 0);
  if (voci.length === 0) return null;

  return (
    <div className="w-56 max-w-[80vw] rounded-xl border border-border bg-surface p-3 text-xs shadow-lg">
      <div className="mb-1.5 font-display text-sm font-semibold">{label}</div>
      <ul className="flex flex-col gap-1">
        {voci.map((p) => (
          <li key={String(p.dataKey)} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 truncate">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="truncate">{p.name}</span>
            </span>
            <span className="font-figures whitespace-nowrap">{formatCurrency(p.value as number)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CategorySpendingTrendChart({
  spese,
  from,
  to,
}: {
  spese: Spesa[];
  from: string;
  to: string;
}) {
  const { data, categorie } = useMemo(() => buildSerie(spese, from, to), [spese, from, to]);
  const tickInterval = adaptiveTickInterval(data.length);

  const [nascoste, setNascoste] = useState<Set<string>>(() => defaultNascoste(categorie));
  const [prevSpese, setPrevSpese] = useState(spese);

  // Nuovo periodo/filtro (nuovo riferimento `spese`) = nuovo set di categorie
  // attive: azzera i toggle manuali e riapplica il default "prime N visibili".
  if (spese !== prevSpese) {
    setPrevSpese(spese);
    setNascoste(defaultNascoste(categorie));
  }

  function toggleCategoria(nome: string) {
    setNascoste((prev) => {
      const next = new Set(prev);
      if (next.has(nome)) next.delete(nome);
      else next.add(nome);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {categorie.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categorie.map((cat) => {
            const nascosta = nascoste.has(cat.nome);
            const colore = resolveCategoryColor(cat.nome, cat.colore);
            return (
              <button
                key={cat.nome}
                type="button"
                onClick={() => toggleCategoria(cat.nome)}
                aria-pressed={!nascosta}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-opacity ${
                  nascosta ? "opacity-40" : ""
                }`}
                style={{ borderColor: colore }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colore }} />
                {cat.nome}
              </button>
            );
          })}
        </div>
      )}

      <div className="h-72 w-full rounded-xl border border-border bg-surface p-4">
        {categorie.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted">
            Nessuna spesa nel periodo selezionato.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />
              <XAxis
                dataKey="label"
                tick={axisTick}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
                interval={tickInterval}
              />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} width={56} />
              <Tooltip content={<CategoryTrendTooltip />} />
              {categorie
                .filter((cat) => !nascoste.has(cat.nome))
                .map((cat) => (
                  <Line
                    key={cat.nome}
                    type="monotone"
                    dataKey={cat.nome}
                    name={cat.nome}
                    stroke={resolveCategoryColor(cat.nome, cat.colore)}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    activeDot={{ r: 3 }}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
