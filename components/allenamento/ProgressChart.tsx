"use client";

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
import { adaptiveTickInterval } from "@/lib/spese-utils";
import { CHART_PALETTE } from "./progress-chart-palette";

// Separato da ProgressTable per poter caricare recharts (~400KB) con next/dynamic
// solo quando c'e' un grafico da mostrare, invece che nel bundle della pagina Storico.
const axisTick = { fill: "var(--muted)", fontSize: 12, fontFamily: "var(--font-mono)" };

function ProgressTooltip({ active, payload, label }: Partial<TooltipContentProps<number, string>>) {
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
            <span className="font-figures whitespace-nowrap">{p.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProgressChart({
  datiGrafico,
  metrichGrafico,
}: {
  datiGrafico: Record<string, string | number | null>[];
  metrichGrafico: string[];
}) {
  return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datiGrafico} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />
              <XAxis
                dataKey="label"
                tick={axisTick}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
                interval={adaptiveTickInterval(datiGrafico.length)}
              />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<ProgressTooltip />} />
              {metrichGrafico.map((metrica, i) => (
                <Line
                  key={metrica}
                  type="monotone"
                  dataKey={metrica}
                  name={metrica}
                  stroke={`var(${CHART_PALETTE[i % CHART_PALETTE.length]})`}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                  isAnimationActive
                  animationDuration={700}
                  animationEasing="ease-out"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
  );
}
