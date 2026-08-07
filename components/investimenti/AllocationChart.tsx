"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { PieLabelRenderProps, TooltipContentProps } from "recharts";
import { formatCurrency } from "@/lib/investimenti/format";
import type { Posizione } from "@/lib/investimenti/types";

type Gruppo = "crypto" | "etf" | "etc";

const GRUPPO_LABEL: Record<Gruppo, string> = { crypto: "Crypto", etf: "ETF", etc: "ETC" };
const GRUPPO_COLOR_VAR: Record<Gruppo, string> = {
  crypto: "--invest-pie-crypto",
  etf: "--invest-pie-etf",
  etc: "--invest-pie-etc",
};

type Fetta = { gruppo: Gruppo; nome: string; totale: number; percentuale: number };

// 3 categorie in questo grafico: ETF ed ETC (es. oro fisico) separati da
// quando 'etc' esiste come tipo asset a sé, crypto a parte. Le azioni/indici
// restano dentro "etf" come raggruppamento generico — la suddivisione per
// singolo tipo/asset resta nella tabella Posizioni.
function allocationByGruppo(posizioni: Posizione[]): Fetta[] {
  const totals = new Map<Gruppo, number>();
  for (const p of posizioni) {
    const gruppo: Gruppo =
      p.asset.tipo === "crypto" ? "crypto" : p.asset.tipo === "etc" ? "etc" : "etf";
    const valore = p.valoreAttuale ?? p.costoTotaleCarico;
    totals.set(gruppo, (totals.get(gruppo) ?? 0) + valore);
  }
  const totaleComplessivo = [...totals.values()].reduce((s, v) => s + v, 0);
  return [...totals.entries()]
    .map(([gruppo, totale]) => ({
      gruppo,
      nome: GRUPPO_LABEL[gruppo],
      totale,
      percentuale: totaleComplessivo > 0 ? (totale / totaleComplessivo) * 100 : 0,
    }))
    .sort((a, b) => b.totale - a.totale);
}

// Etichetta percentuale nella fascia della ciambella (non fuori, per non
// dover gestire label line su fette anche molto piccole dopo il FIX 4): sotto
// il 4% si nasconde, resterebbe illeggibile/sovrapposta.
function renderPercentLabel(props: PieLabelRenderProps) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  if (
    typeof cx !== "number" ||
    typeof cy !== "number" ||
    typeof midAngle !== "number" ||
    typeof innerRadius !== "number" ||
    typeof outerRadius !== "number" ||
    typeof percent !== "number" ||
    percent < 0.04
  ) {
    return null;
  }
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fill="#fff"
      fontSize={12}
      fontWeight={600}
      className="font-figures pointer-events-none"
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  );
}

function AllocationTooltip({ active, payload }: Partial<TooltipContentProps<number, string>>) {
  if (!active || !payload || payload.length === 0) return null;
  const fetta = payload[0].payload as Fetta;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 flex items-center gap-1.5 font-display text-sm font-semibold">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: payload[0].color }} />
        {fetta.nome}
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted">Valore</span>
        <span className="font-figures">{formatCurrency(fetta.totale)}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted">Quota</span>
        <span className="font-figures">{fetta.percentuale.toFixed(1)}%</span>
      </div>
    </div>
  );
}

export function AllocationChart({ posizioni }: { posizioni: Posizione[] }) {
  const data = allocationByGruppo(posizioni);

  if (data.length === 0) {
    return (
      <div className="card flex h-72 w-full items-center justify-center p-4">
        <p className="text-sm text-muted">Nessuna posizione aperta.</p>
      </div>
    );
  }

  const totaleValore = data.reduce((s, d) => s + d.totale, 0);

  return (
    <div className="card flex h-72 w-full flex-col gap-1 p-4">
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
              label={renderPercentLabel}
              labelLine={false}
            >
              {data.map((entry) => (
                <Cell key={entry.gruppo} fill={`var(${GRUPPO_COLOR_VAR[entry.gruppo]})`} />
              ))}
            </Pie>
            <text
              x="50%"
              y="47%"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="currentColor"
              className="font-figures text-foreground text-lg font-semibold"
            >
              {formatCurrency(totaleValore)}
            </text>
            <text
              x="50%"
              y="58%"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="currentColor"
              className="text-muted text-[10px] uppercase tracking-wide"
            >
              Valore attuale
            </text>
            <Tooltip content={<AllocationTooltip />} />
            <Legend wrapperStyle={{ color: "var(--muted)", fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
