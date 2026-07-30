"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/spese-utils";
import type { Deposito, Spesa } from "@/lib/types";

const chartTooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  color: "var(--foreground)",
  fontFamily: "var(--font-sans)",
};

const axisTick = { fill: "var(--muted)", fontSize: 12, fontFamily: "var(--font-mono)" };

type DailyPoint = { data: string; label: string; uscite: number; entrate: number };

function dailyFlow(spese: Spesa[], depositi: Deposito[], from: string, to: string): DailyPoint[] {
  const uscite = new Map<string, number>();
  for (const s of spese) uscite.set(s.data, (uscite.get(s.data) ?? 0) + s.importo);

  const entrate = new Map<string, number>();
  for (const d of depositi) entrate.set(d.data, (entrate.get(d.data) ?? 0) + d.importo);

  const points: DailyPoint[] = [];
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  for (let d = start; d <= end; d = new Date(d.getTime() + 24 * 60 * 60 * 1000)) {
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" });
    points.push({
      data: key,
      label,
      uscite: uscite.get(key) ?? 0,
      entrate: entrate.get(key) ?? 0,
    });
  }
  return points;
}

export function DailyTrendChart({
  spese,
  depositi,
  from,
  to,
}: {
  spese: Spesa[];
  depositi: Deposito[];
  from: string;
  to: string;
}) {
  const daily = dailyFlow(spese, depositi, from, to);
  const tickInterval = daily.length > 45 ? Math.ceil(daily.length / 12) : "preserveStartEnd";

  return (
    <div className="h-72 w-full rounded-xl border border-border bg-surface p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={daily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="usciteFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--spesa)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--spesa)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="entrateFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--entrata)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--entrata)" stopOpacity={0} />
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
            dataKey="uscite"
            name="Spese"
            isAnimationActive={false}
            stroke="var(--spesa)"
            strokeWidth={2}
            fill="url(#usciteFill)"
            dot={false}
          />
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
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
