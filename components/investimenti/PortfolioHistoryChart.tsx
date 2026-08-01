"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipContentProps } from "recharts";
import { formatCurrency } from "@/lib/investimenti/format";

const axisTick = { fill: "var(--muted)", fontSize: 12, fontFamily: "var(--font-mono)" };

type Snapshot = { data: string; valore_totale: number };
type Granularita = "giorno" | "settimana" | "mese";

const GRANULARITA: { value: Granularita; label: string }[] = [
  { value: "giorno", label: "Giorno" },
  { value: "settimana", label: "Settimana" },
  { value: "mese", label: "Mese" },
];

function chiaveAggregazione(dataIso: string, granularita: Granularita): string {
  if (granularita === "giorno") return dataIso;
  const d = new Date(`${dataIso}T00:00:00Z`);
  if (granularita === "mese") return dataIso.slice(0, 7); // YYYY-MM
  const isoDay = (d.getUTCDay() + 6) % 7; // 0 = lunedì
  d.setUTCDate(d.getUTCDate() - isoDay);
  return d.toISOString().slice(0, 10); // inizio settimana
}

// Un punto per chiave di aggregazione: l'ultimo snapshot disponibile in
// quel giorno/settimana/mese (gli snapshot sono già ordinati per data asc).
function aggrega(snapshots: Snapshot[], granularita: Granularita): Snapshot[] {
  if (granularita === "giorno") return snapshots;
  const perChiave = new Map<string, Snapshot>();
  for (const s of snapshots) {
    perChiave.set(chiaveAggregazione(s.data, granularita), s);
  }
  return [...perChiave.values()];
}

function HistoryTooltip({ active, payload, label }: Partial<TooltipContentProps<number, string>>) {
  if (!active || !payload || payload.length === 0) return null;
  const valore = payload[0]?.value as number | undefined;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-display text-sm font-semibold">{label}</div>
      {typeof valore === "number" && <span className="font-figures">{formatCurrency(valore)}</span>}
    </div>
  );
}

function formatLabel(dataIso: string, granularita: Granularita): string {
  const d = new Date(`${dataIso}T00:00:00Z`);
  if (granularita === "mese") return d.toLocaleDateString("it-IT", { month: "short", year: "2-digit" });
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export function PortfolioHistoryChart({ snapshots }: { snapshots: Snapshot[] }) {
  const [granularita, setGranularita] = useState<Granularita>("giorno");

  const data = useMemo(
    () =>
      aggrega(snapshots, granularita).map((s) => ({
        label: formatLabel(s.data, granularita),
        valore: s.valore_totale,
      })),
    [snapshots, granularita]
  );

  return (
    <div className="card flex h-72 w-full flex-col p-4">
      <div className="mb-2 flex items-center justify-end gap-1">
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

      {snapshots.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
          <p className="text-sm text-muted">Nessuno storico ancora disponibile.</p>
          <p className="text-xs text-muted">
            Lo storico si popolerà una volta collegato l&apos;aggiornamento automatico dei prezzi.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />
            <XAxis dataKey="label" tick={axisTick} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} width={64} />
            <Tooltip content={<HistoryTooltip />} />
            <Area
              type="monotone"
              dataKey="valore"
              name="Valore portafoglio"
              isAnimationActive
              animationDuration={700}
              animationEasing="ease-out"
              stroke="var(--accent)"
              strokeWidth={2}
              fill="url(#portfolioFill)"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
