"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import type { MouseHandlerDataParam, TooltipContentProps } from "recharts";
import { depositoToItem, spesaToItem, type TransactionListItem } from "./TransactionList";
import { DayDetailModal } from "./DayDetailModal";
import { adaptiveTickInterval, formatCurrency } from "@/lib/spese-utils";
import type { Categoria, Deposito, Spesa } from "@/lib/types";

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

function transactionsByDay(spese: Spesa[], depositi: Deposito[]): Map<string, TransactionListItem[]> {
  const map = new Map<string, TransactionListItem[]>();
  for (const s of spese) {
    const list = map.get(s.data) ?? [];
    list.push(spesaToItem(s));
    map.set(s.data, list);
  }
  for (const d of depositi) {
    const list = map.get(d.data) ?? [];
    list.push(depositoToItem(d));
    map.set(d.data, list);
  }
  return map;
}

// Anteprima leggera on-hover (solo desktop, il touch non ha hover): valori
// aggregati del giorno. Coesiste con il click, che apre il modale di
// dettaglio giorno — i due meccanismi sono indipendenti.
function DailyHoverTooltip({ active, payload, label }: Partial<TooltipContentProps<number, string>>) {
  if (!active || !payload || payload.length === 0) return null;
  const uscite = payload.find((p) => p.dataKey === "uscite")?.value as number | undefined;
  const entrate = payload.find((p) => p.dataKey === "entrate")?.value as number | undefined;

  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-display text-sm font-semibold capitalize">{label}</div>
      {typeof uscite === "number" && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-spesa">Spese</span>
          <span className="font-figures">{formatCurrency(uscite)}</span>
        </div>
      )}
      {typeof entrate === "number" && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-entrata">Entrate</span>
          <span className="font-figures">{formatCurrency(entrate)}</span>
        </div>
      )}
    </div>
  );
}

export function DailyTrendChart({
  spese,
  depositi,
  from,
  to,
  categorie,
  onCategoriaCreata,
}: {
  spese: Spesa[];
  depositi: Deposito[];
  from: string;
  to: string;
  categorie: Categoria[];
  onCategoriaCreata?: (categoria: Categoria) => void;
}) {
  const router = useRouter();
  const daily = dailyFlow(spese, depositi, from, to);
  const tickInterval = adaptiveTickInterval(daily.length);
  const transactions = useMemo(() => transactionsByDay(spese, depositi), [spese, depositi]);

  const [giornoSelezionato, setGiornoSelezionato] = useState<string | null>(null);

  function handleChartClick(state: MouseHandlerDataParam) {
    const index = typeof state.activeTooltipIndex === "number" ? state.activeTooltipIndex : null;
    if (index === null) return;
    const point = daily[index];
    if (!point) return;
    setGiornoSelezionato(point.data);
  }

  function handleChanged() {
    router.refresh();
  }

  return (
    <div className="card card-hover h-72 w-full p-4">
      <div className="relative h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={daily}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            onClick={handleChartClick}
            style={{ cursor: "pointer" }}
          >
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
            <Tooltip trigger="hover" content={<DailyHoverTooltip />} />
            <Legend wrapperStyle={{ color: "var(--muted)", fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="uscite"
              name="Spese"
              isAnimationActive
              animationDuration={700}
              animationEasing="ease-out"
              stroke="var(--spesa)"
              strokeWidth={2}
              fill="url(#usciteFill)"
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="entrate"
              name="Entrate"
              isAnimationActive
              animationDuration={700}
              animationEasing="ease-out"
              stroke="var(--entrata)"
              strokeWidth={2}
              fill="url(#entrateFill)"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {giornoSelezionato && (
        <DayDetailModal
          giorno={giornoSelezionato}
          items={transactions.get(giornoSelezionato) ?? []}
          categorie={categorie}
          onClose={() => setGiornoSelezionato(null)}
          onCategoriaCreata={onCategoriaCreata}
          onChanged={handleChanged}
        />
      )}
    </div>
  );
}
