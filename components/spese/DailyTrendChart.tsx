"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import type { MouseHandlerDataParam } from "recharts";
import { X } from "lucide-react";
import {
  TransactionList,
  depositoToItem,
  spesaToItem,
  type TransactionListItem,
} from "./TransactionList";
import { TransactionDetailModal } from "./TransactionDetailModal";
import { adaptiveTickInterval } from "@/lib/spese-utils";
import type { Categoria, Deposito, Spesa } from "@/lib/types";

const axisTick = { fill: "var(--muted)", fontSize: 12, fontFamily: "var(--font-mono)" };

const POPOVER_WIDTH = 256;

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

function dayLabel(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "long",
  });
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
  const plotRef = useRef<HTMLDivElement>(null);

  const [miniLista, setMiniLista] = useState<{ giorno: string; left: number; top: number } | null>(
    null
  );
  const [dettaglio, setDettaglio] = useState<TransactionListItem | null>(null);

  function handleChartClick(state: MouseHandlerDataParam) {
    const index = typeof state.activeTooltipIndex === "number" ? state.activeTooltipIndex : null;
    if (index === null) return;
    const point = daily[index];
    if (!point) return;

    const items = transactions.get(point.data) ?? [];
    if (items.length === 0) return;

    if (items.length === 1) {
      setMiniLista(null);
      setDettaglio(items[0]);
      return;
    }

    setMiniLista((prev) => {
      if (prev?.giorno === point.data) return null;
      const plotWidth = plotRef.current?.clientWidth ?? 400;
      const plotHeight = plotRef.current?.clientHeight ?? 288;
      const rawX = state.activeCoordinate?.x ?? plotWidth / 2;
      const rawY = state.activeCoordinate?.y ?? 0;
      return {
        giorno: point.data,
        left: Math.min(Math.max(rawX - POPOVER_WIDTH / 2, 0), Math.max(plotWidth - POPOVER_WIDTH, 0)),
        top: Math.min(rawY + 16, Math.max(plotHeight - 160, 0)),
      };
    });
  }

  function handleChanged() {
    router.refresh();
  }

  return (
    <div className="h-72 w-full rounded-xl border border-border bg-surface p-4">
      <div ref={plotRef} className="relative h-full w-full">
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
              activeDot={{ r: 4 }}
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
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>

        {miniLista && (
          <div
            className="absolute z-10 rounded-xl border border-border bg-surface p-3 shadow-lg"
            style={{ left: miniLista.left, top: miniLista.top, width: POPOVER_WIDTH }}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-display text-sm font-semibold capitalize">
                {dayLabel(miniLista.giorno)}
              </span>
              <button
                type="button"
                onClick={() => setMiniLista(null)}
                aria-label="Chiudi"
                className="rounded-full p-1 text-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <TransactionList
              items={transactions.get(miniLista.giorno) ?? []}
              onItemClick={(item) => {
                setDettaglio(item);
                setMiniLista(null);
              }}
            />
          </div>
        )}
      </div>

      {dettaglio && (
        <TransactionDetailModal
          transazione={dettaglio}
          categorie={categorie}
          onClose={() => setDettaglio(null)}
          onCategoriaCreata={onCategoriaCreata}
          onChanged={handleChanged}
        />
      )}
    </div>
  );
}
