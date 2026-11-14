"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { Domanda } from "@/lib/trading/lezioni";
import { useProgressiTrading } from "@/hooks/useProgressiTrading";

export function QuizLezione({ slug, domande }: { slug: string; domande: Domanda[] }) {
  const [risposte, setRisposte] = useState<(number | null)[]>(() => domande.map(() => null));
  const { completate, segna } = useProgressiTrading();
  const fatta = completate.includes(slug);
  const tutteGiuste = risposte.every((r, i) => r === domande[i].corretta);

  function rispondi(i: number, scelta: number) {
    if (risposte[i] !== null) return;
    const nuove = risposte.map((r, k) => (k === i ? scelta : r));
    setRisposte(nuove);
    if (nuove.every((r, k) => r === domande[k].corretta)) segna(slug);
  }

  return (
    <div className="flex flex-col gap-5">
      {domande.map((d, i) => {
        const r = risposte[i];
        return (
          <div key={d.domanda} className="flex flex-col gap-2">
            <p className="text-[17px] font-medium">{d.domanda}</p>
            <div className="flex flex-col gap-2">
              {d.opzioni.map((o, k) => {
                const scelta = r === k;
                const giusta = k === d.corretta;
                const stato = r === null ? "" : giusta ? "border-entrata bg-entrata/10" : scelta ? "border-spesa bg-spesa/10" : "opacity-60";
                return (
                  <button
                    key={o}
                    type="button"
                    disabled={r !== null}
                    onClick={() => rispondi(i, k)}
                    className={`flex min-h-11 items-center justify-between gap-3 rounded-[12px] border border-border px-3 py-2 text-left text-[15px] transition-colors ${stato}`}
                  >
                    <span>{o}</span>
                    {r !== null && giusta && <Check className="h-4 w-4 shrink-0 text-entrata" />}
                    {scelta && !giusta && <X className="h-4 w-4 shrink-0 text-spesa" />}
                  </button>
                );
              })}
            </div>
            {r !== null && (
              <p className={`text-[15px] ${r === d.corretta ? "text-entrata" : "text-foreground"}`}>
                {r === d.corretta ? "Esatto. " : "Non proprio. "}
                <span className="text-muted">{d.spiegazione}</span>
              </p>
            )}
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-3">
        {risposte.some((r) => r !== null) && !tutteGiuste && risposte.every((r) => r !== null) && (
          <button type="button" onClick={() => setRisposte(domande.map(() => null))} className="btn-secondary min-h-11">
            Riprova
          </button>
        )}
        <button type="button" onClick={() => segna(slug, !fatta)} className={fatta ? "btn-secondary min-h-11" : "btn-primary min-h-11"}>
          {fatta ? "Completata ✓ (annulla)" : "Segna come completata"}
        </button>
      </div>
    </div>
  );
}
