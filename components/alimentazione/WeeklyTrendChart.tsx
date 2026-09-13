"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipContentProps } from "recharts";
import type { PuntoTrendGiornaliero } from "@/lib/alimentazione/queries";

const axisTick = { fill: "var(--muted)", fontSize: 12, fontFamily: "var(--font-mono)" };

function TrendTooltip({ active, payload, label }: Partial<TooltipContentProps<number, string>>) {
  if (!active || !payload || payload.length === 0) return null;
  const kcal = payload[0]?.value as number | undefined;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-display text-sm font-semibold capitalize">{label}</div>
      {typeof kcal === "number" && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted">Kcal</span>
          <span className="font-figures">{kcal}</span>
        </div>
      )}
    </div>
  );
}

export function WeeklyTrendChart({
  punti,
  targetKcal,
}: {
  punti: PuntoTrendGiornaliero[];
  targetKcal: number | null;
}) {
  return (
    <div className="card card-hover h-64 w-full p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={punti} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="kcalFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />
          <XAxis dataKey="label" tick={axisTick} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} width={48} />
          <Tooltip trigger="hover" content={<TrendTooltip />} />
          {targetKcal !== null && (
            <ReferenceLine
              y={targetKcal}
              stroke="var(--muted)"
              strokeDasharray="4 4"
              label={{ value: "Target", position: "insideTopRight", fill: "var(--muted)", fontSize: 11 }}
            />
          )}
          <Area
            type="monotone"
            dataKey="kcal"
            name="Kcal"
            isAnimationActive
            animationDuration={700}
            animationEasing="ease-out"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="url(#kcalFill)"
            dot={{ r: 3, fill: "var(--accent)", strokeWidth: 0 }}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
