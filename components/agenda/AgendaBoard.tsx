"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { CalendarDays } from "lucide-react";
import { DayPanel } from "./DayPanel";
import { QuickAddBar } from "./QuickAddBar";
import type { Evento, NotaGiorno } from "@/lib/agenda/types";

// FullCalendar (core + plugin daygrid/timegrid/list/interaction) è una
// libreria pesante: import dinamico con ssr:false per tenerla fuori dal
// bundle iniziale della route /agenda, stesso principio di ChartsSection in
// spese/investimenti (vedi commento lì).
const CalendarView = dynamic(() => import("./CalendarView").then((m) => m.CalendarView), { ssr: false });
// Solo client: "oggi", "domani" e gli orari dipendono dal fuso del
// dispositivo, lato server (UTC) darebbero un mismatch di idratazione.
const ProssimiImpegni = dynamic(() => import("./ProssimiImpegni").then((m) => m.ProssimiImpegni), { ssr: false });

// Data locale del dispositivo (non UTC). Sul server non si conosce il fuso:
// lo snapshot è null e il giorno di default compare dopo l'idratazione.
function nessunaSottoscrizione() {
  return () => {};
}
function oggiLocale(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Orchestratore client: tiene lo stato del giorno selezionato (aperto dal
// calendario o da un evento) e lo passa al pannello sotto. Il calendario è
// l'unico riquadro di navigazione (il mini-calendario separato è stato
// assorbito qui: FullCalendar già mostra mese/settimana/lista e naviga da
// solo, il giorno scelto resta evidenziato — vedi CalendarView), il
// pannello giorno vive a piena larghezza sotto invece che in una colonna
// laterale stretta. page.tsx resta un server component puro, tutta
// l'interattività vive qui.
export function AgendaBoard({ eventi, note }: { eventi: Evento[]; note: NotaGiorno[] }) {
  // undefined = nessuna scelta ancora: vale "oggi", così il pannello non è
  // mai vuoto all'apertura. null = chiuso esplicitamente dall'utente.
  const [scelta, setScelta] = useState<string | null | undefined>(undefined);
  const oggi = useSyncExternalStore(nessunaSottoscrizione, oggiLocale, () => null);
  const giornoSelezionato = scelta === undefined ? oggi : scelta;
  const pannello = useRef<HTMLDivElement>(null);

  function setGiornoSelezionato(data: string | null) {
    setScelta(data);
    // Su telefono il pannello sta sotto il calendario, fuori schermo: dopo il
    // tocco su un giorno lo si porta in vista (senza animazione se richiesto).
    if (data && window.matchMedia("(max-width: 767px)").matches) {
      const ridotto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      requestAnimationFrame(() => pannello.current?.scrollIntoView({ block: "start", behavior: ridotto ? "auto" : "smooth" }));
    }
  }

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
      <ProssimiImpegni eventi={eventi} onSelectEvent={apriEvento} />

      <QuickAddBar />

      <CalendarView
        eventi={eventi}
        selezionata={giornoSelezionato}
        onSelectDate={setGiornoSelezionato}
        onSelectEvent={apriEvento}
      />

      {giornoSelezionato ? (
        <div ref={pannello} className="scroll-mt-16">
          <DayPanel
            data={giornoSelezionato}
            eventi={eventiDelGiorno}
            notaIniziale={notaDelGiorno}
            onClose={() => setScelta(null)}
          />
        </div>
      ) : (
        <div className="card flex flex-col items-center gap-2 p-8 text-center text-sm text-muted">
          <CalendarDays className="h-5 w-5" />
          Seleziona un giorno nel calendario per vedere eventi, note e posta.
        </div>
      )}
    </div>
  );
}
