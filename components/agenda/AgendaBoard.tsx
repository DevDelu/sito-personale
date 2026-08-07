"use client";

import { useState } from "react";
import { CalendarView } from "./CalendarView";
import { MiniCalendarSidebar } from "./MiniCalendarSidebar";
import { DayPanel } from "./DayPanel";
import { QuickAddBar } from "./QuickAddBar";
import type { Evento, NotaGiorno } from "@/lib/agenda/types";

// Orchestratore client: tiene lo stato del giorno selezionato (aperto dal
// calendario principale, dal mini-calendario o da un evento) e lo passa al
// pannello laterale. page.tsx resta un server component puro, tutta
// l'interattività vive qui.
export function AgendaBoard({ eventi, note }: { eventi: Evento[]; note: NotaGiorno[] }) {
  const [giornoSelezionato, setGiornoSelezionato] = useState<string | null>(null);

  function apriEvento(evento: Evento) {
    setGiornoSelezionato(evento.data_inizio.slice(0, 10));
  }

  const eventiDelGiorno = giornoSelezionato
    ? eventi.filter(
        (e) => e.data_inizio.slice(0, 10) <= giornoSelezionato && e.data_fine.slice(0, 10) >= giornoSelezionato
      )
    : [];
  const notaDelGiorno = giornoSelezionato ? (note.find((n) => n.data === giornoSelezionato) ?? null) : null;

  return (
    <div className="flex flex-col gap-4">
      <QuickAddBar />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <CalendarView eventi={eventi} onSelectDate={setGiornoSelezionato} onSelectEvent={apriEvento} />

        <div className="flex flex-col gap-4">
          <MiniCalendarSidebar eventi={eventi} selezionata={giornoSelezionato} onSelectDate={setGiornoSelezionato} />
          {giornoSelezionato && (
            <DayPanel
              data={giornoSelezionato}
              eventi={eventiDelGiorno}
              notaIniziale={notaDelGiorno}
              onClose={() => setGiornoSelezionato(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
