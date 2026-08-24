"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { CalendarView } from "./CalendarView";
import { DayPanel } from "./DayPanel";
import { QuickAddBar } from "./QuickAddBar";
import type { Evento, NotaGiorno } from "@/lib/agenda/types";

// Orchestratore client: tiene lo stato del giorno selezionato (aperto dal
// calendario o da un evento) e lo passa al pannello sotto. Il calendario è
// l'unico riquadro di navigazione (il mini-calendario separato è stato
// assorbito qui: FullCalendar già mostra mese/settimana/lista e naviga da
// solo, il giorno scelto resta evidenziato — vedi CalendarView), il
// pannello giorno vive a piena larghezza sotto invece che in una colonna
// laterale stretta. page.tsx resta un server component puro, tutta
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

      <CalendarView
        eventi={eventi}
        selezionata={giornoSelezionato}
        onSelectDate={setGiornoSelezionato}
        onSelectEvent={apriEvento}
      />

      {giornoSelezionato ? (
        <DayPanel
          data={giornoSelezionato}
          eventi={eventiDelGiorno}
          notaIniziale={notaDelGiorno}
          onClose={() => setGiornoSelezionato(null)}
        />
      ) : (
        <div className="card flex flex-col items-center gap-2 p-8 text-center text-sm text-muted">
          <CalendarDays className="h-5 w-5" />
          Seleziona un giorno nel calendario per vedere eventi, note e posta.
        </div>
      )}
    </div>
  );
}
