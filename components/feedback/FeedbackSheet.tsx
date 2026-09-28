"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, Crosshair, X } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { SegmentedPicker } from "@/components/ui/SegmentedControl";
import { registraFocusCampoFeedback } from "@/lib/feedback/bus";
import { FEEDBACK_TESTO_MAX, type FeedbackTipo } from "@/lib/feedback/types";
import type { FeedbackBreve } from "@/lib/feedback/queries";
import { ETICHETTA_STATO } from "@/lib/feedback/stati";

const TIPI: { value: FeedbackTipo; label: string }[] = [
  { value: "problema", label: "Problema" },
  { value: "complicato", label: "Complicato" },
  { value: "idea", label: "Idea" },
];

const PLACEHOLDER: Record<FeedbackTipo, string> = {
  problema: "Cosa è successo?",
  complicato: "Cosa ti ha rallentato?",
  idea: "Cosa ti servirebbe?",
};

export type BozzaFeedback = { tipo: FeedbackTipo; testo: string };

// Su mobile lo sheet scende dall'alto (Sheet posizione="alto"): con la
// tastiera aperta subito, un pannello ancorato in basso veniva coperto o
// spinto fuori schermo da iOS. "Invia" resta nella barra in alto a destra.
//
// La bozza (tipo e testo) vive nel FeedbackProvider: con "Indica il punto"
// lo sheet si smonta per lasciare la pagina toccabile e poi ritorna.
export function FeedbackSheet({
  bozza,
  onBozza,
  onClose,
  onInvia,
  punto,
  onIndicaPunto,
  onRimuoviPunto,
  aperti,
  notaPer,
  onNotaPer,
  riapertura = false,
}: {
  bozza: BozzaFeedback;
  onBozza: (b: BozzaFeedback) => void;
  onClose: () => void;
  onInvia: () => void;
  // Chip "Punto: Tabella movimenti › Modifica", già senza cifre.
  punto: string | null;
  onIndicaPunto: () => void;
  onRimuoviPunto: () => void;
  // Feedback non chiusi sulla stessa pagina ("Evita i doppioni").
  aperti: FeedbackBreve[];
  notaPer: FeedbackBreve | null;
  onNotaPer: (f: FeedbackBreve | null) => void;
  // Dopo "Non risolto" dall'avviso di verifica: testo facoltativo.
  riapertura?: boolean;
}) {
  const [listaAperta, setListaAperta] = useState(false);
  const campo = useRef<HTMLTextAreaElement>(null);
  const vuoto = bozza.testo.trim().length === 0;
  const puoInviare = riapertura || !vuoto;

  useEffect(() => {
    registraFocusCampoFeedback(() => campo.current?.focus({ preventScroll: true }));
    const el = campo.current;
    return () => {
      registraFocusCampoFeedback(null);
      // Chiude la tastiera insieme allo sheet: su iOS un campo smontato
      // mentre ha il focus può lasciare la pagina scrollata/spostata.
      el?.blur();
    };
  }, []);

  function invia() {
    if (puoInviare) onInvia();
  }

  const titolo = riapertura ? "Non risolto" : notaPer ? "Aggiungi nota" : "Feedback";
  const placeholder = riapertura
    ? "Cosa non va ancora? (facoltativo)"
    : notaPer
      ? "Cosa vuoi aggiungere?"
      : PLACEHOLDER[bozza.tipo];

  return (
    <Sheet onClose={onClose} posizione="alto" area="feedback.sheet">
      <div className="flex flex-col">
        <div className="app-static grid h-12 grid-cols-[1fr_auto_1fr] items-center border-b border-[var(--app-hairline)] px-2">
          <button
            type="button"
            onClick={onClose}
            className="justify-self-start px-2 py-2 text-[17px] text-accent active:opacity-60"
          >
            Annulla
          </button>
          <h2 className="text-[17px] font-semibold">{titolo}</h2>
          <button
            type="button"
            onClick={invia}
            disabled={!puoInviare}
            className="justify-self-end px-2 py-2 text-[17px] font-semibold text-accent active:opacity-60 disabled:text-muted disabled:opacity-60"
          >
            {riapertura && vuoto ? "Fatto" : "Invia"}
          </button>
        </div>

        <div className="flex flex-col gap-3 p-4">
          {!riapertura && aperti.length > 0 && (
            <div className="app-static flex flex-col overflow-hidden rounded-xl bg-surface-hover">
              {notaPer ? (
                <div className="flex items-center gap-2 px-3 py-2 text-[15px]">
                  <span className="min-w-0 flex-1 truncate">
                    Nota su: <span className="text-muted">{notaPer.testo}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onNotaPer(null)}
                    aria-label="Scrivi un feedback nuovo invece di una nota"
                    className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center text-muted active:opacity-60"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setListaAperta((v) => !v)}
                  aria-expanded={listaAperta}
                  className="flex min-h-[40px] items-center gap-2 px-3 py-2 text-left text-[15px] active:opacity-60"
                >
                  <span className="flex-1">
                    Qui hai già {aperti.length === 1 ? "1 segnalazione aperta" : `${aperti.length} segnalazioni aperte`}
                  </span>
                  <ChevronRight className={`h-4 w-4 text-muted transition-transform ${listaAperta ? "rotate-90" : ""}`} />
                </button>
              )}
              {listaAperta && !notaPer && (
                <ul className="divide-y divide-[var(--app-hairline)] border-t border-[var(--app-hairline)]">
                  {aperti.map((f) => (
                    <li key={f.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onNotaPer(f);
                          setListaAperta(false);
                          campo.current?.focus({ preventScroll: true });
                        }}
                        className="flex w-full flex-col gap-0.5 px-3 py-2 text-left active:bg-surface"
                      >
                        <span className="line-clamp-2 text-[15px]">{f.testo}</span>
                        <span className="text-[13px] text-muted">
                          {ETICHETTA_STATO[f.stato]} · tocca per aggiungere una nota
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {!riapertura && !notaPer && (
            <SegmentedPicker
              label="Tipo di feedback"
              items={TIPI}
              value={bozza.tipo}
              onChange={(tipo) => onBozza({ ...bozza, tipo })}
            />
          )}
          <textarea
            ref={campo}
            autoFocus
            rows={5}
            maxLength={FEEDBACK_TESTO_MAX}
            value={bozza.testo}
            onChange={(e) => onBozza({ ...bozza, testo: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                invia();
              }
            }}
            placeholder={placeholder}
            aria-label={placeholder}
            className="field-input w-full resize-none text-[17px]"
          />
          <div className="app-static flex items-center justify-between gap-3">
            {riapertura || notaPer ? (
              <span />
            ) : punto ? (
              <button
                type="button"
                onClick={onRimuoviPunto}
                aria-label="Rimuovi il punto indicato"
                className="flex min-h-[32px] min-w-0 items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-[13px] text-accent active:opacity-60"
              >
                <Crosshair className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Punto: {punto}</span>
                <X className="h-3.5 w-3.5 shrink-0" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onIndicaPunto}
                className="flex min-h-[32px] items-center gap-1.5 text-[13px] text-muted underline-offset-2 active:opacity-60"
              >
                <Crosshair className="h-3.5 w-3.5" />
                Indica il punto
              </button>
            )}
            <span className="shrink-0 text-[13px] text-muted">
              {bozza.testo.length}/{FEEDBACK_TESTO_MAX}
            </span>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
