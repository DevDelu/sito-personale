"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { categoryColor } from "@/lib/category-style";
import { formatCurrency } from "@/lib/spese-utils";
import type { Spesa } from "@/lib/types";

const chartTooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  color: "var(--foreground)",
  fontFamily: "var(--font-sans)",
};

function breakdown(spese: Spesa[]) {
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

export function CategoryPieChart({ spese }: { spese: Spesa[] }) {
  const data = breakdown(spese);
  const totale = data.reduce((s, d) => s + d.totale, 0);

  return (
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
              >
                {data.map((entry) => (
                  <Cell key={entry.nome} fill={entry.colore || categoryColor(entry.nome)} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, _name, item) => {
                  const v = typeof value === "number" ? value : 0;
                  const pct = totale > 0 ? ((v / totale) * 100).toFixed(1) : "0";
                  const nome =
                    typeof item?.payload === "object" && item.payload && "nome" in item.payload
                      ? String((item.payload as { nome: unknown }).nome)
                      : "";
                  return [`${formatCurrency(v)} (${pct}%)`, nome];
                }}
                contentStyle={chartTooltipStyle}
              />
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
  );
}
