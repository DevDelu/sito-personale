"use client";

import { useMemo } from "react";
import { coloreEvento } from "@/lib/agenda/colori";
import { prossimiImpegni } from "@/lib/agenda/prossimi";
import type { Evento } from "@/lib/agenda/types";

function formatOrario(e: Evento): string {
  if (e.tutto_il_giorno) return "Tutto il giorno";
  return new Date(e.data_inizio).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

// Primo blocco della pagina Agenda: cosa c'è da fare oggi e nei prossimi
// giorni, prima del calendario. Tap su un impegno = apre il suo giorno nel
// pannello sotto il calendario.
export function ProssimiImpegni({
  eventi,
  onSelectEvent,
}: {
  eventi: Evento[];
  onSelectEvent: (evento: Evento) => void;
}) {
  // Calcolato al render: dopo mezzanotte basta riaprire la pagina.
  const gruppi = useMemo(() => prossimiImpegni(eventi, new Date()), [eventi]);

  return (
    <section className="card flex flex-col gap-3 p-4" aria-labelledby="agenda-da-fare">
      <h2 id="agenda-da-fare" className="font-display text-lg font-semibold">
        Da fare
      </h2>

      {gruppi.length === 0 ? (
        <p className="text-sm text-muted">Niente in programma nei prossimi 7 giorni.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {gruppi.map((g) => (
            <div key={g.data} className="flex flex-col gap-1.5">
              <h3
                className={`text-xs font-semibold tracking-wide uppercase ${
                  g.etichetta === "Oggi" ? "text-accent" : "text-muted"
                }`}
              >
                {g.etichetta}
              </h3>
              <ul className="flex flex-col">
                {g.eventi.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => onSelectEvent(e)}
                      className="flex w-full items-center gap-3 rounded-lg px-1 py-2 text-left transition-colors hover:bg-surface-hover active:bg-surface-hover"
                    >
                      <span
                        aria-hidden
                        className="h-8 w-1 shrink-0 rounded-full"
                        style={{ backgroundColor: coloreEvento(e) }}
                      />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium">{e.titolo}</span>
                        <span className="font-figures text-xs text-muted">
                          {formatOrario(e)}
                          {e.luogo ? ` · ${e.luogo}` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
