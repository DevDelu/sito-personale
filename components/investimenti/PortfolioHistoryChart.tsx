"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipContentProps } from "recharts";
import { formatCurrency } from "@/lib/investimenti/format";
import type { GruppoStorico, PuntoPortafoglio } from "@/lib/investimenti/queries";

const axisTick = { fill: "var(--muted)", fontSize: 12, fontFamily: "var(--font-mono)" };

type Granularita = "giorno" | "settimana" | "mese";

const GRANULARITA: { value: Granularita; label: string }[] = [
  { value: "giorno", label: "Giorno" },
  { value: "settimana", label: "Settimana" },
  { value: "mese", label: "Mese" },
];

// Palette per le linee di dettaglio: "etf" ha sempre lo stesso colore, ogni
// gruppo crypto (oggi solo BTC) prende il successivo in ordine, ciclando se
// in futuro ce ne fossero più di 3.
const GRUPPO_PALETTE = ["--invest-crypto", "--invest-stock", "--invest-indice"];

function colorePerGruppo(chiave: string, gruppi: GruppoStorico[]): string {
  if (chiave === "etf") return "var(--invest-etf)";
  const altri = gruppi.filter((g) => g.chiave !== "etf");
  const idx = Math.max(
    0,
    altri.findIndex((g) => g.chiave === chiave)
  );
  return `var(${GRUPPO_PALETTE[idx % GRUPPO_PALETTE.length]})`;
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

  return (
    <div className="card flex h-72 w-full flex-col p-4">
      <div className="mb-2 flex flex-wrap items-center justify-end gap-1">
        {gruppi.length > 0 && (
          <button
            type="button"
            onClick={() => setDettaglioAttivo((v) => !v)}
            aria-pressed={dettaglioAttivo}
            className={`mr-auto rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-150 ease-out active:scale-95 ${
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

      {punti.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
          <p className="text-sm text-muted">Nessuno storico ancora disponibile.</p>
          <p className="text-xs text-muted">
            Lo storico si popolerà una volta registrata la prima transazione con una fonte prezzi collegata.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />
            <XAxis dataKey="label" tick={axisTick} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} width={64} />
            <Tooltip content={<HistoryTooltip />} />
            {dettaglioAttivo && <Legend wrapperStyle={{ color: "var(--muted)", fontSize: 12 }} />}
            <Line
              type="monotone"
              dataKey="totale"
              name="Totale"
              isAnimationActive
              animationDuration={700}
              animationEasing="ease-out"
              stroke="var(--accent)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            {dettaglioAttivo &&
              gruppi.map((g) => (
                <Line
                  key={g.chiave}
                  type="monotone"
                  dataKey={g.chiave}
                  name={g.label}
                  isAnimationActive
                  animationDuration={700}
                  animationEasing="ease-out"
                  stroke={colorePerGruppo(g.chiave, gruppi)}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
