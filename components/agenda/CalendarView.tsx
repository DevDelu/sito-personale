"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventDropArg } from "@fullcalendar/core";
import type { DateClickArg, EventResizeDoneArg } from "@fullcalendar/interaction";
import { Undo2 } from "lucide-react";
import { useAgendaMutations } from "@/hooks/useAgendaMutations";
import type { CategoriaEvento, Evento } from "@/lib/agenda/types";

const CATEGORIA_COLORE: Record<CategoriaEvento, string> = {
  ferie: "var(--agenda-ferie)",
  visita: "var(--agenda-visita)",
  scadenza: "var(--agenda-scadenza)",
  personale: "var(--agenda-personale)",
  altro: "var(--muted)",
};

type SpostamentoUndo = {
  id: string;
  titolo: string;
  precedente: { data_inizio: string; data_fine: string };
};

export function CalendarView({
  eventi,
  onSelectDate,
  onSelectEvent,
}: {
  eventi: Evento[];
  onSelectDate: (data: string) => void;
  onSelectEvent: (evento: Evento) => void;
}) {
  const router = useRouter();
  const { aggiorna } = useAgendaMutations();
  const [undo, setUndo] = useState<SpostamentoUndo | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fcEvents = eventi.map((e) => ({
    id: e.id,
    title: e.titolo,
    start: e.data_inizio,
    end: e.data_fine,
    allDay: e.tutto_il_giorno,
    backgroundColor: CATEGORIA_COLORE[e.categoria] ?? "var(--accent)",
    borderColor: CATEGORIA_COLORE[e.categoria] ?? "var(--accent)",
  }));

  function mostraUndo(id: string, titolo: string, precedente: { data_inizio: string; data_fine: string }) {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndo({ id, titolo, precedente });
    undoTimer.current = setTimeout(() => setUndo(null), 6000);
  }

  // Stessa gestione per drag&drop e resize: entrambi cambiano
  // data_inizio/data_fine e riportano l'evento a pending_push (lato server,
  // in aggiornaEvento). `oldEvent` espone gli orari precedenti al gesto,
  // usati per l'undo senza dover tenere uno stato separato lato client.
  async function handleSposta(arg: EventDropArg | EventResizeDoneArg) {
    const evento = arg.event;
    const nuovaInizio = evento.start?.toISOString();
    const nuovaFine = (evento.end ?? evento.start)?.toISOString();
    if (!nuovaInizio || !nuovaFine) return;

    const precedente = {
      data_inizio: arg.oldEvent.start?.toISOString() ?? nuovaInizio,
      data_fine: (arg.oldEvent.end ?? arg.oldEvent.start)?.toISOString() ?? nuovaFine,
    };

    try {
      await aggiorna(evento.id, { data_inizio: nuovaInizio, data_fine: nuovaFine });
      mostraUndo(evento.id, evento.title, precedente);
      router.refresh();
    } catch {
      arg.revert();
    }
  }

  async function handleUndo() {
    if (!undo) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    const daRipristinare = undo;
    setUndo(null);
    await aggiorna(daRipristinare.id, daRipristinare.precedente);
    router.refresh();
  }

  return (
    <div className="relative">
      <div className="agenda-calendar card p-3">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,listWeek" }}
          events={fcEvents}
          editable
          eventStartEditable
          eventDurationEditable
          dayMaxEvents
          height="auto"
          locale="it"
          firstDay={1}
          buttonText={{ today: "Oggi", month: "Mese", week: "Settimana", list: "Lista" }}
          dateClick={(info: DateClickArg) => onSelectDate(info.dateStr)}
          eventClick={(info: EventClickArg) => {
            const evento = eventi.find((e) => e.id === info.event.id);
            if (evento) onSelectEvent(evento);
          }}
          eventDrop={handleSposta}
          eventResize={handleSposta}
        />
      </div>

      {undo && (
        <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
          <div className="animate-slide-up flex items-center gap-3 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg">
            <span>&ldquo;{undo.titolo}&rdquo; spostato</span>
            <button
              type="button"
              onClick={handleUndo}
              className="flex items-center gap-1 rounded-full bg-background/15 px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-background/25"
            >
              <Undo2 className="h-3 w-3" />
              Annulla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
