"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Evento } from "@/lib/agenda/types";

const GIORNI = ["L", "M", "M", "G", "V", "S", "D"];

function toKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildGriglia(anno: number, mese: number): Date[] {
  const primoDelMese = new Date(Date.UTC(anno, mese, 1));
  const offset = (primoDelMese.getUTCDay() + 6) % 7; // 0 = lunedì
  const inizio = new Date(primoDelMese);
  inizio.setUTCDate(inizio.getUTCDate() - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(inizio);
    d.setUTCDate(d.getUTCDate() + i);
    return d;
  });
}

// Mini calendario di navigazione rapida (mese-a-colpo-d'occhio + salto a un
// giorno), distinto dal calendario principale FullCalendar: qui il click
// apre subito il pannello giorno, senza passare dalla vista mensile intera.
export function MiniCalendarSidebar({
  eventi,
  selezionata,
  onSelectDate,
}: {
  eventi: Evento[];
  selezionata: string | null;
  onSelectDate: (data: string) => void;
}) {
  const oggi = new Date();
  const [cursore, setCursore] = useState(() => new Date(Date.UTC(oggi.getUTCFullYear(), oggi.getUTCMonth(), 1)));

  const giorniConEventi = new Set(eventi.map((e) => e.data_inizio.slice(0, 10)));
  const griglia = buildGriglia(cursore.getUTCFullYear(), cursore.getUTCMonth());
  const meseCorrente = cursore.getUTCMonth();
  const oggiKey = toKey(oggi);

  return (
    <div className="card flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-semibold capitalize">
          {cursore.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCursore((c) => new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth() - 1, 1)))}
            aria-label="Mese precedente"
            className="btn-icon"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setCursore((c) => new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth() + 1, 1)))}
            aria-label="Mese successivo"
            className="btn-icon"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted">
        {GIORNI.map((g, i) => (
          <span key={`${g}-${i}`}>{g}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {griglia.map((d) => {
          const key = toKey(d);
          const fuoriMese = d.getUTCMonth() !== meseCorrente;
          const haEventi = giorniConEventi.has(key);
          const attiva = key === selezionata;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(key)}
              className={`relative flex h-7 w-7 items-center justify-center rounded-full text-xs transition-all duration-150 ease-out active:scale-90 ${
                attiva
                  ? "bg-accent font-semibold text-accent-foreground"
                  : key === oggiKey
                    ? "border border-accent/50 text-accent"
                    : fuoriMese
                      ? "text-muted/40 hover:text-foreground"
                      : "text-foreground hover:bg-surface-hover"
              }`}
            >
              {d.getUTCDate()}
              {haEventi && !attiva && <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-accent" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
