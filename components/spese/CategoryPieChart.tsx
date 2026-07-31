"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from "recharts";
import { categoryColor } from "@/lib/category-style";
import { formatCurrency } from "@/lib/spese-utils";
import { TransactionList, spesaToItem, type TransactionListItem } from "./TransactionList";
import { TransactionDetailModal } from "./TransactionDetailModal";
import type { Categoria, Spesa } from "@/lib/types";
import type { Range } from "./FilterBar";

type CategorySlice = { nome: string; totale: number; colore: string | null };

function breakdown(spese: Spesa[]): CategorySlice[] {
  const totals = new Map<string, { totale: number; colore: string | null }>();
  for (const s of spese) {
    const nome = s.categoria_nome ?? "Senza categoria";
    const entry = totals.get(nome) ?? { totale: 0, colore: s.categoria_colore };
    entry.totale += s.importo;
    totals.set(nome, entry);
  }
  return [...totals.entries()]
    .map(([nome, { totale, colore }]) => ({ nome, totale, colore }))
    .sort((a, b) => b.totale - a.totale);
}

function transactionsByCategory(spese: Spesa[]): Map<string, TransactionListItem[]> {
  const map = new Map<string, TransactionListItem[]>();
  for (const s of spese) {
    const nome = s.categoria_nome ?? "Senza categoria";
    const list = map.get(nome) ?? [];
    list.push(spesaToItem(s));
    map.set(nome, list);
  }
  return map;
}

function startOfWeekIso(dateIso: string): string {
  const d = new Date(`${dateIso}T00:00:00Z`);
  const isoDay = (d.getUTCDay() + 6) % 7; // 0 = lunedì
  d.setUTCDate(d.getUTCDate() - isoDay);
  return d.toISOString().slice(0, 10);
}

function weekRangeLabel(weekStartIso: string, todayWeekStartIso: string): string {
  if (weekStartIso === todayWeekStartIso) return "Questa settimana";

  const prevWeekStart = new Date(`${todayWeekStartIso}T00:00:00Z`);
  prevWeekStart.setUTCDate(prevWeekStart.getUTCDate() - 7);
  if (weekStartIso === prevWeekStart.toISOString().slice(0, 10)) return "Settimana scorsa";

  const start = new Date(`${weekStartIso}T00:00:00Z`);
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" });
  return `${fmt(start)} – ${fmt(end)}`;
}

function groupByWeek(items: TransactionListItem[]): { label: string; items: TransactionListItem[] }[] {
  const todayWeekStart = startOfWeekIso(new Date().toISOString().slice(0, 10));
  const groups = new Map<string, TransactionListItem[]>();
  for (const item of items) {
    const weekStart = startOfWeekIso(item.data);
    const list = groups.get(weekStart) ?? [];
    list.push(item);
    groups.set(weekStart, list);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([weekStart, groupItems]) => ({
      label: weekRangeLabel(weekStart, todayWeekStart),
      items: groupItems,
    }));
}

export function CategoryPieChart({
  spese,
  categorie,
  range,
  onCategoriaCreata,
}: {
  spese: Spesa[];
  categorie: Categoria[];
  range: Range;
  onCategoriaCreata?: (categoria: Categoria) => void;
}) {
  const router = useRouter();
  const data = breakdown(spese);
  const totale = data.reduce((s, d) => s + d.totale, 0);
  const transactions = useMemo(() => transactionsByCategory(spese), [spese]);

  const [categoriaSelezionata, setCategoriaSelezionata] = useState<string | null>(null);
  const [dettaglio, setDettaglio] = useState<TransactionListItem | null>(null);

  function handleSliceClick(index: number) {
    const entry = data[index];
    if (!entry) return;
    setCategoriaSelezionata((prev) => (prev === entry.nome ? null : entry.nome));
  }

  function handleChanged() {
    router.refresh();
  }

  const itemsSelezionati = categoriaSelezionata ? transactions.get(categoriaSelezionata) ?? [] : [];
  const gruppi = range.preset === "7" ? null : groupByWeek(itemsSelezionati);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-72 w-full rounded-xl border border-border bg-surface p-4">
        {data.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted">
            Nessuna spesa nel periodo selezionato.
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="totale"
                  nameKey="nome"
                  isAnimationActive={false}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  onClick={(_, index) => handleSliceClick(index)}
                  style={{ cursor: "pointer" }}
                >
                  {data.map((entry) => (
                    <Cell
                      key={entry.nome}
                      fill={entry.colore || categoryColor(entry.nome)}
                      opacity={
                        categoriaSelezionata && categoriaSelezionata !== entry.nome ? 0.35 : 1
                      }
                    />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ color: "var(--muted)", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-10">
              <span className="font-figures text-lg font-bold">{formatCurrency(totale)}</span>
              <span className="text-xs text-muted">totale</span>
            </div>
          </>
        )}
      </div>

      {categoriaSelezionata && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold">{categoriaSelezionata}</h3>
            <button
              type="button"
              onClick={() => setCategoriaSelezionata(null)}
              className="text-xs text-muted hover:text-foreground"
            >
              Chiudi
            </button>
          </div>

          {itemsSelezionati.length === 0 ? (
            <p className="text-xs text-muted">Nessuna transazione in questa categoria nel periodo.</p>
          ) : gruppi ? (
            <div className="flex flex-col gap-3">
              {gruppi.map((gruppo) => (
                <div key={gruppo.label} className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted">{gruppo.label}</span>
                  <TransactionList items={gruppo.items} onItemClick={setDettaglio} />
                </div>
              ))}
            </div>
          ) : (
            <TransactionList items={itemsSelezionati} onItemClick={setDettaglio} />
          )}
        </div>
      )}

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
