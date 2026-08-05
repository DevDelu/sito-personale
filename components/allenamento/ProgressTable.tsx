"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { adaptiveTickInterval } from "@/lib/spese-utils";
import type { LogConNome } from "@/lib/allenamento/queries";
import type { Sessione } from "@/lib/allenamento/types";

const COLONNE_DEFAULT = ["Trazioni", "Dip", "Push up", "Dead hang", "Goblet squat", "Shoulder press"];
const CHART_PALETTE = ["--accent", "--invest-etf", "--invest-crypto", "--invest-stock", "--invest-indice"];

const axisTick = { fill: "var(--muted)", fontSize: 12, fontFamily: "var(--font-mono)" };

function formatTempo(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
}

function valoreComparabile(l: LogConNome): number {
  if (l.tipo_metrica === "tempo") return l.tempo_effettivo_sec ?? 0;
  return l.rip_effettive ?? 0;
}

function testoCella(l: LogConNome): string {
  if (l.tipo_metrica === "tempo") return l.tempo_effettivo_sec != null ? formatTempo(l.tempo_effettivo_sec) : "—";
  const rip = l.rip_effettive != null ? `${l.rip_effettive}` : "—";
  return l.peso_effettivo != null ? `${rip} @ ${l.peso_effettivo}kg` : rip;
}

// Se un esercizio compare più volte nella stessa sessione (più serie), la
// cella mostra la migliore: rip massime per le metriche a ripetizioni,
// tempo massimo per quelle a tempo.
function migliorLogPerSessione(log: LogConNome[]): Map<string, LogConNome> {
  const map = new Map<string, LogConNome>();
  for (const l of log) {
    const key = `${l.sessione_id}::${l.esercizio_nome}`;
    const attuale = map.get(key);
    if (!attuale || valoreComparabile(l) > valoreComparabile(attuale)) map.set(key, l);
  }
  return map;
}

function ProgressTooltip({ active, payload, label }: Partial<TooltipContentProps<number, string>>) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-display text-sm font-semibold">{label}</div>
      <ul className="flex flex-col gap-0.5">
        {payload.map((p) => (
          <li key={String(p.dataKey)} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
              {p.name}
            </span>
            <span className="font-figures whitespace-nowrap">{p.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProgressTable({ sessioni, log }: { sessioni: Sessione[]; log: LogConNome[] }) {
  const esercizDisponibili = useMemo(
    () => [...new Set(log.map((l) => l.esercizio_nome))].sort(),
    [log]
  );

  const [colonneAttive, setColonneAttive] = useState<string[]>(() =>
    COLONNE_DEFAULT.filter((c) => esercizDisponibili.includes(c))
  );
  const [metrichGrafico, setMetricheGrafico] = useState<string[]>(() => colonneAttive.slice(0, 2));

  const migliori = useMemo(() => migliorLogPerSessione(log), [log]);

  function toggleColonna(nome: string) {
    setColonneAttive((prev) => (prev.includes(nome) ? prev.filter((c) => c !== nome) : [...prev, nome]));
  }

  function toggleMetricaGrafico(nome: string) {
    setMetricheGrafico((prev) => {
      if (prev.includes(nome)) return prev.filter((c) => c !== nome);
      if (prev.length >= 2) return [prev[1], nome]; // al massimo 2 metriche in contemporanea
      return [...prev, nome];
    });
  }

  // Sessioni in ordine cronologico crescente (per calcolo trend/PR e grafico).
  const sessioniAsc = useMemo(() => sessioni.slice().reverse(), [sessioni]);

  function trend(colonna: string, sessioneIndexDesc: number): "su" | "giu" | "pari" | null {
    const attuale = migliori.get(`${sessioni[sessioneIndexDesc].id}::${colonna}`);
    if (!attuale) return null;
    for (let j = sessioneIndexDesc + 1; j < sessioni.length; j++) {
      const precedente = migliori.get(`${sessioni[j].id}::${colonna}`);
      if (precedente) {
        const diff = valoreComparabile(attuale) - valoreComparabile(precedente);
        return diff > 0 ? "su" : diff < 0 ? "giu" : "pari";
      }
    }
    return null;
  }

  const record = useMemo(() => {
    const map = new Map<string, LogConNome>();
    for (const colonna of colonneAttive) {
      let best: LogConNome | null = null;
      for (const s of sessioni) {
        const l = migliori.get(`${s.id}::${colonna}`);
        if (l && (!best || valoreComparabile(l) > valoreComparabile(best))) best = l;
      }
      if (best) map.set(colonna, best);
    }
    return map;
  }, [migliori, sessioni, colonneAttive]);

  const datiGrafico = useMemo(
    () =>
      sessioniAsc.map((s) => {
        const punto: Record<string, string | number> = {
          label: new Date(`${s.data}T00:00:00Z`).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }),
        };
        for (const metrica of metrichGrafico) {
          const l = migliori.get(`${s.id}::${metrica}`);
          if (l) punto[metrica] = valoreComparabile(l);
        }
        return punto;
      }),
    [sessioniAsc, metrichGrafico, migliori]
  );

  if (esercizDisponibili.length === 0) {
    return (
      <div className="card flex items-center justify-center p-6">
        <p className="text-sm text-muted">Nessun dato ancora disponibile per la tabella progressi.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-medium text-muted">Tabella progressi</h2>
      </div>

      <div className="flex flex-wrap gap-2">
        {esercizDisponibili.map((nome) => (
          <button
            key={nome}
            type="button"
            onClick={() => toggleColonna(nome)}
            aria-pressed={colonneAttive.includes(nome)}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-150 ease-out active:scale-95 ${
              colonneAttive.includes(nome)
                ? "border-accent bg-accent text-accent-foreground shadow-sm"
                : "border-border text-muted hover:text-foreground"
            }`}
          >
            {nome}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="sticky left-0 bg-surface px-4 py-2 font-medium">Data</th>
              {colonneAttive.map((c) => (
                <th key={c} className="px-4 py-2 font-medium whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border bg-accent/5">
              <td className="sticky left-0 bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-wide text-accent">
                Record
              </td>
              {colonneAttive.map((c) => {
                const r = record.get(c);
                return (
                  <td key={c} className="font-figures px-4 py-2 font-semibold text-accent">
                    {r ? testoCella(r) : "—"}
                  </td>
                );
              })}
            </tr>
            {sessioni.map((s, index) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="sticky left-0 bg-surface px-4 py-2 whitespace-nowrap">
                  {new Date(`${s.data}T00:00:00Z`).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" })}
                </td>
                {colonneAttive.map((c) => {
                  const l = migliori.get(`${s.id}::${c}`);
                  const t = trend(c, index);
                  return (
                    <td key={c} className="font-figures px-4 py-2 whitespace-nowrap">
                      {l ? (
                        <span className="inline-flex items-center gap-1">
                          {testoCella(l)}
                          {t === "su" && <ArrowUp className="h-3 w-3 text-entrata" />}
                          {t === "giu" && <ArrowDown className="h-3 w-3 text-spesa" />}
                          {t === "pari" && <Minus className="h-3 w-3 text-muted" />}
                        </span>
                      ) : (
                        <span className="text-muted/50">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {esercizDisponibili.map((nome) => (
            <button
              key={nome}
              type="button"
              onClick={() => toggleMetricaGrafico(nome)}
              aria-pressed={metrichGrafico.includes(nome)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-150 ease-out active:scale-95 ${
                metrichGrafico.includes(nome) ? "opacity-100" : "opacity-40"
              }`}
              style={{
                borderColor: `var(${CHART_PALETTE[metrichGrafico.indexOf(nome) % CHART_PALETTE.length] ?? "--border"})`,
              }}
            >
              {nome}
            </button>
          ))}
        </div>

        <div className="card h-64 w-full p-4">
          {metrichGrafico.length === 0 || datiGrafico.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted">Seleziona 1-2 esercizi per vedere il grafico.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={datiGrafico} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />
                <XAxis
                  dataKey="label"
                  tick={axisTick}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                  interval={adaptiveTickInterval(datiGrafico.length)}
                />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<ProgressTooltip />} />
                {metrichGrafico.map((metrica, i) => (
                  <Line
                    key={metrica}
                    type="monotone"
                    dataKey={metrica}
                    name={metrica}
                    stroke={`var(${CHART_PALETTE[i % CHART_PALETTE.length]})`}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                    isAnimationActive
                    animationDuration={700}
                    animationEasing="ease-out"
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
