"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipContentProps } from "recharts";
import { formatCurrency } from "@/lib/investimenti/format";

const axisTick = { fill: "var(--muted)", fontSize: 12, fontFamily: "var(--font-mono)" };

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

export function PortfolioHistoryChart({
  snapshots,
}: {
  snapshots: { data: string; valore_totale: number }[];
}) {
  if (snapshots.length === 0) {
    return (
      <div className="card flex h-72 w-full flex-col items-center justify-center gap-1 p-4 text-center">
        <p className="text-sm text-muted">Nessuno storico ancora disponibile.</p>
        <p className="text-xs text-muted">
          Lo storico si popolerà una volta collegato l&apos;aggiornamento automatico dei prezzi.
        </p>
      </div>
    );
  }

  const data = snapshots.map((s) => ({
    label: new Date(`${s.data}T00:00:00Z`).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "2-digit" }),
    valore: s.valore_totale,
  }));

  return (
    <div className="card h-72 w-full p-4">
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
    </div>
  );
}
