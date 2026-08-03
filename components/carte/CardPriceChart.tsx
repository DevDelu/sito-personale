"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import type { TooltipContentProps } from "recharts";
import { formatCurrency } from "@/lib/carte/format";
import type { PricePoint } from "@/lib/carte/queries";

function ChartTooltip({ active, payload }: Partial<TooltipContentProps<number, string>>) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload as { date: string; price: number } | undefined;
  if (!point) return null;
  const label = new Date(`${point.date}T00:00:00Z`).toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
  return (
    <div className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs shadow-lg">
      <div className="text-muted">{label}</div>
      <span className="font-figures font-semibold">{formatCurrency(point.price)}</span>
    </div>
  );
}

export function CardPriceChart({ history }: { history: PricePoint[] }) {
  if (history.length < 2) {
    return (
      <p className="text-xs text-muted">
        {history.length === 0
          ? "Nessuno storico prezzo ancora disponibile."
          : "Serve almeno un secondo rilevamento per mostrare un andamento."}
      </p>
    );
  }

  const primo = history[0].price;
  const ultimo = history[history.length - 1].price;
  const colorVar = ultimo === primo ? "--muted" : ultimo > primo ? "--entrata" : "--spesa";

  return (
    <div className="h-24 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={history} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="cardPriceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={`var(${colorVar})`} stopOpacity={0.25} />
              <stop offset="100%" stopColor={`var(${colorVar})`} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="price"
            isAnimationActive
            animationDuration={600}
            animationEasing="ease-out"
            stroke={`var(${colorVar})`}
            strokeWidth={2}
            fill="url(#cardPriceFill)"
            dot={false}
            activeDot={{ r: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
