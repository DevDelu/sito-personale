"use client";

import { useState } from "react";
import { Apple, Calendar, Plus, Wallet } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { ListGroup, ListRowLink } from "@/components/ui/ListGroup";

// Slot centrale della tab bar mobile: non porta a una sezione propria, apre
// uno sheet per scegliere cosa aggiungere al volo (spesa, pasto o evento in
// agenda) invece di dover prima entrare nella sezione giusta.
export function QuickAddButton() {
  const [aperto, setAperto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAperto(true)}
        aria-label="Aggiungi"
        className="flex flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 active:opacity-60"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <span className="app-static text-[11px] leading-none font-medium text-muted">Aggiungi</span>
      </button>

      {aperto && (
        <Sheet onClose={() => setAperto(false)}>
          <div className="flex flex-col gap-4 p-4">
            <h2 className="font-display text-lg font-semibold">Cosa vuoi aggiungere?</h2>
            <ListGroup>
              <ListRowLink
                href="/spese/nuovo"
                icon={<Wallet className="h-5 w-5" strokeWidth={1.75} />}
                title="Spesa o entrata"
                onNavigate={() => setAperto(false)}
                chevron
              />
              <ListRowLink
                href="/alimentazione/aggiungi"
                icon={<Apple className="h-5 w-5" strokeWidth={1.75} />}
                title="Pasto"
                onNavigate={() => setAperto(false)}
                chevron
              />
              <ListRowLink
                href="/agenda"
                icon={<Calendar className="h-5 w-5" strokeWidth={1.75} />}
                title="Evento in agenda"
                subtitle="Apre l'agenda, con l'aggiunta al volo in cima"
                onNavigate={() => setAperto(false)}
                chevron
              />
            </ListGroup>
          </div>
        </Sheet>
      )}
    </>
  );
}
