"use client";

import { useEffect, useRef, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { SegmentedPicker } from "@/components/ui/SegmentedControl";
import { registraFocusCampoFeedback } from "@/lib/feedback/bus";
import { FEEDBACK_TESTO_MAX, type FeedbackTipo } from "@/lib/feedback/types";

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

// "Invia" sta nella barra in alto a destra, non in fondo: su iOS la tastiera
// (che si apre subito) coprirebbe un pulsante in basso.
export function FeedbackSheet({
  tipoIniziale,
  onClose,
  onInvia,
}: {
  tipoIniziale: FeedbackTipo;
  onClose: () => void;
  onInvia: (tipo: FeedbackTipo, testo: string) => void;
}) {
  const [tipo, setTipo] = useState<FeedbackTipo>(tipoIniziale);
  const [testo, setTesto] = useState("");
  const campo = useRef<HTMLTextAreaElement>(null);
  const vuoto = testo.trim().length === 0;

  useEffect(() => {
    registraFocusCampoFeedback(() => campo.current?.focus({ preventScroll: true }));
    return () => registraFocusCampoFeedback(null);
  }, []);

  function invia() {
    if (!vuoto) onInvia(tipo, testo.trim());
  }

  return (
    <Sheet onClose={onClose}>
      <div className="flex flex-col">
        <div className="app-static grid h-12 grid-cols-[1fr_auto_1fr] items-center border-b border-[var(--app-hairline)] px-2">
          <button
            type="button"
            onClick={onClose}
            className="justify-self-start px-2 py-2 text-[17px] text-accent active:opacity-60"
          >
            Annulla
          </button>
          <h2 className="text-[17px] font-semibold">Feedback</h2>
          <button
            type="button"
            onClick={invia}
            disabled={vuoto}
            className="justify-self-end px-2 py-2 text-[17px] font-semibold text-accent active:opacity-60 disabled:text-muted disabled:opacity-60"
          >
            Invia
          </button>
        </div>

        <div className="flex flex-col gap-3 p-4">
          <SegmentedPicker label="Tipo di feedback" items={TIPI} value={tipo} onChange={setTipo} />
          <textarea
            ref={campo}
            autoFocus
            rows={5}
            maxLength={FEEDBACK_TESTO_MAX}
            value={testo}
            onChange={(e) => setTesto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                invia();
              }
            }}
            placeholder={PLACEHOLDER[tipo]}
            aria-label={PLACEHOLDER[tipo]}
            className="field-input w-full resize-none text-[17px]"
          />
          <span className="app-static self-end text-[13px] text-muted">
            {testo.length}/{FEEDBACK_TESTO_MAX}
          </span>
        </div>
      </div>
    </Sheet>
  );
}
