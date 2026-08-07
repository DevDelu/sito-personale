"use client";

import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import { formatCurrency } from "@/lib/investimenti/format";
import { adaptiveTickInterval } from "@/lib/spese-utils";
import type { GruppoStorico, PuntoPortafoglio } from "@/lib/investimenti/queries";
import { PortfolioDateRangeFilter } from "@/components/investimenti/PortfolioDateRangeFilter";

const axisTick = { fill: "var(--muted)", fontSize: 11, fontFamily: "var(--font-mono)" };

type Granularita = "giorno" | "settimana" | "mese";

const GRANULARITA: { value: Granularita; label: string }[] = [
  { value: "giorno", label: "Giorno" },
  { value: "settimana", label: "Settimana" },
  { value: "mese", label: "Mese" },
];

// Stessi colori del grafico a torta (AllocationChart): "etf"/"etc" fissi,
// ogni gruppo crypto (oggi solo BTC) sull'unica var crypto disponibile — se
// in futuro serviranno più crypto separate, aggiungere nuove var
// --invest-pie-* seguendo la stessa convenzione, non colori improvvisati.
function colorePerGruppo(chiave: string): string {
  if (chiave === "etf") return "var(--invest-pie-etf)";
  if (chiave === "etc") return "var(--invest-pie-etc)";
  return "var(--invest-pie-crypto)";
}

function chiaveAggregazione(dataIso: string, granularita: Granularita): string {
  if (granularita === "giorno") return dataIso;
  const d = new Date(`${dataIso}T00:00:00Z`);
  if (granularita === "mese") return dataIso.slice(0, 7); // YYYY-MM
  const isoDay = (d.getUTCDay() + 6) % 7; // 0 = lunedì
  d.setUTCDate(d.getUTCDate() - isoDay);
  return d.toISOString().slice(0, 10); // inizio settimana
}

// Un punto per chiave di aggregazione: l'ultimo punto disponibile in quel
// giorno/settimana/mese (i punti arrivano già ordinati per data asc).
function aggrega(punti: PuntoPortafoglio[], granularita: Granularita): PuntoPortafoglio[] {
  if (granularita === "giorno") return punti;
  const perChiave = new Map<string, PuntoPortafoglio>();
  for (const p of punti) perChiave.set(chiaveAggregazione(p.data, granularita), p);
  return [...perChiave.values()];
}

function formatLabel(dataIso: string, granularita: Granularita): string {
  const d = new Date(`${dataIso}T00:00:00Z`);
  if (granularita === "mese") return d.toLocaleDateString("it-IT", { month: "short", year: "2-digit" });
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

// Formato compatto per l'asse prezzo (in stile trading: "12,5k €" invece di
// "12.500,00 €"), altrimenti le etichette dell'asse destro sono troppo
// larghe e affollate su valori a 4-5 cifre.
function formatAxisValue(v: number): string {
  if (Math.abs(v) >= 1000) {
    return `${(v / 1000).toLocaleString("it-IT", { maximumFractionDigits: 1 })}k €`;
  }
  return `${Math.round(v)} €`;
}

function HistoryTooltip({ active, payload, label }: Partial<TooltipContentProps<number, string>>) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-display text-sm font-semibold">{label}</div>
      <ul className="flex flex-col gap-0.5">
        {payload.map((p) => (
          <li key={String(p.dataKey)} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
              {p.name}
            </span>
            <span className="font-figures whitespace-nowrap">{formatCurrency(p.value as number)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PortfolioHistoryChart({
  punti,
  gruppi,
}: {
  punti: PuntoPortafoglio[];
  gruppi: GruppoStorico[];
}) {
  const [granularita, setGranularita] = useState<Granularita>("giorno");
  const [dettaglioAttivo, setDettaglioAttivo] = useState(false);

  const data = useMemo(
    () =>
      aggrega(punti, granularita).map((p) => ({
        ...p,
        label: formatLabel(p.data, granularita),
      })),
    [punti, granularita]
  );

  const ultimoValore = data.length > 0 ? (data[data.length - 1].totale as number) : null;

  return (
    <div className="card flex h-80 w-full flex-col p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <PortfolioDateRangeFilter />
        <div className="flex flex-wrap items-center gap-1">
          {gruppi.length > 0 && (
            <button
              type="button"
              onClick={() => setDettaglioAttivo((v) => !v)}
              aria-pressed={dettaglioAttivo}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-150 ease-out active:scale-95 ${
                dettaglioAttivo
                  ? "border-accent bg-accent text-accent-foreground shadow-sm"
                  : "border-border text-muted hover:text-foreground"
              }`}
            >
              Dettaglio per asset
            </button>
          )}
          {GRANULARITA.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setGranularita(g.value)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-150 ease-out active:scale-95 ${
                granularita === g.value
                  ? "border-accent bg-accent text-accent-foreground shadow-sm"
                  : "border-border text-muted hover:text-foreground"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {punti.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
          <p className="text-sm text-muted">Nessuno storico ancora disponibile.</p>
          <p className="text-xs text-muted">
            Lo storico si popolerà una volta registrata la prima transazione con una fonte prezzi collegata.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="portfolioTotaleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.32} />
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={axisTick}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
              interval={adaptiveTickInterval(data.length)}
              minTickGap={24}
            />
            <YAxis
              orientation="right"
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              width={68}
              tickFormatter={formatAxisValue}
              domain={["auto", "auto"]}
            />
            <Tooltip content={<HistoryTooltip />} cursor={{ stroke: "var(--muted)", strokeDasharray: "3 3" }} />
            {dettaglioAttivo && <Legend wrapperStyle={{ color: "var(--muted)", fontSize: 12 }} />}
            {ultimoValore != null && (
              <ReferenceLine
                y={ultimoValore}
                stroke="var(--accent)"
                strokeOpacity={0.5}
                strokeDasharray="4 4"
                ifOverflow="extendDomain"
                label={{
                  value: formatAxisValue(ultimoValore),
                  position: "right",
                  fill: "var(--accent)",
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                }}
              />
            )}
            <Area
              type="linear"
              dataKey="totale"
              name="Totale"
              isAnimationActive
              animationDuration={700}
              animationEasing="ease-out"
              stroke="var(--accent)"
              strokeWidth={2}
              fill="url(#portfolioTotaleGradient)"
              fillOpacity={1}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            {dettaglioAttivo &&
              gruppi.map((g) => (
                <Line
                  key={g.chiave}
                  type="linear"
                  dataKey={g.chiave}
                  name={g.label}
                  isAnimationActive
                  animationDuration={700}
                  animationEasing="ease-out"
                  stroke={colorePerGruppo(g.chiave)}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              ))}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
