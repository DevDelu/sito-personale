"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/investimenti/format";
import type { Posizione } from "@/lib/investimenti/types";

type Gruppo = "crypto" | "etf";

const GRUPPO_LABEL: Record<Gruppo, string> = { crypto: "Crypto", etf: "ETF" };
const GRUPPO_COLOR_VAR: Record<Gruppo, string> = {
  crypto: "--invest-pie-crypto",
  etf: "--invest-pie-etf",
};

// Solo 2 categorie in questo grafico (crypto vs tutto il resto): la
// suddivisione per singolo tipo/asset resta nella tabella Posizioni.
function allocationByGruppo(posizioni: Posizione[]) {
  const totals = new Map<Gruppo, number>();
  for (const p of posizioni) {
    const gruppo: Gruppo = p.asset.tipo === "crypto" ? "crypto" : "etf";
    const valore = p.valoreAttuale ?? p.costoTotaleCarico;
    totals.set(gruppo, (totals.get(gruppo) ?? 0) + valore);
  }
  return [...totals.entries()]
    .map(([gruppo, totale]) => ({ gruppo, nome: GRUPPO_LABEL[gruppo], totale }))
    .sort((a, b) => b.totale - a.totale);
}

export function AllocationChart({ posizioni }: { posizioni: Posizione[] }) {
  const data = allocationByGruppo(posizioni);
  const totale = data.reduce((s, d) => s + d.totale, 0);

  if (data.length === 0) {
    return (
      <div className="card flex h-72 w-full items-center justify-center p-4">
        <p className="text-sm text-muted">Nessuna posizione aperta.</p>
      </div>
    );
  }

  return (
    <div className="card flex h-72 w-full flex-col gap-1 p-4">
      <span className="font-figures text-lg font-bold">{formatCurrency(totale)}</span>
      <div className="min-h-0 flex-1">
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
                <Cell key={entry.gruppo} fill={`var(${GRUPPO_COLOR_VAR[entry.gruppo]})`} />
              ))}
            </Pie>
            <Legend wrapperStyle={{ color: "var(--muted)", fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
