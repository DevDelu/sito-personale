"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from "recharts";
import { formatCurrency, TIPO_ASSET_LABEL } from "@/lib/investimenti/format";
import type { Posizione } from "@/lib/investimenti/types";

const TIPO_COLOR: Record<string, string> = {
  stock: "var(--cat-alimentari)",
  etf: "var(--accent)",
  indice: "var(--cat-bonifici)",
  crypto: "var(--cat-benzina)",
};

function allocationByTipo(posizioni: Posizione[]) {
  const totals = new Map<string, number>();
  for (const p of posizioni) {
    const valore = p.valoreAttuale ?? p.costoTotaleCarico;
    totals.set(p.asset.tipo, (totals.get(p.asset.tipo) ?? 0) + valore);
  }
  return [...totals.entries()]
    .map(([tipo, totale]) => ({ tipo, nome: TIPO_ASSET_LABEL[tipo] ?? tipo, totale }))
    .sort((a, b) => b.totale - a.totale);
}

export function AllocationChart({ posizioni }: { posizioni: Posizione[] }) {
  const data = allocationByTipo(posizioni);
  const totale = data.reduce((s, d) => s + d.totale, 0);

  if (data.length === 0) {
    return (
      <div className="card flex h-72 w-full items-center justify-center p-4">
        <p className="text-sm text-muted">Nessuna posizione aperta.</p>
      </div>
    );
  }

  return (
    <div className="card relative h-72 w-full p-4">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="totale"
            nameKey="nome"
            isAnimationActive
            animationDuration={600}
            animationEasing="ease-out"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
          >
            {data.map((entry) => (
              <Cell key={entry.tipo} fill={TIPO_COLOR[entry.tipo] ?? "var(--muted)"} />
            ))}
          </Pie>
          <Legend wrapperStyle={{ color: "var(--muted)", fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-10">
        <span className="font-figures text-lg font-bold">{formatCurrency(totale)}</span>
        <span className="text-xs text-muted">allocazione</span>
      </div>
    </div>
  );
}
