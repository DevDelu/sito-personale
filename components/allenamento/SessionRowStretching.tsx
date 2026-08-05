"use client";

import { useEffect } from "react";
import { useCountdown } from "@/hooks/useCountdown";
import type { SchedaEsercizioConNome } from "@/lib/allenamento/types";

// Countdown singolo per una zona corporea. L'avanzamento automatico tra le
// zone (Gambe → Petto → Spalle → Schiena) è gestito dal componente padre:
// ogni riga di stretching è un "passo" a sé nella sequenza della sessione,
// onComplete fa avanzare al passo successivo senza intervento dell'utente.
export function SessionRowStretching({
  row,
  tick,
  finish,
  onComplete,
  pausaGlobale,
}: {
  row: SchedaEsercizioConNome;
  tick: () => void;
  finish: () => void;
  onComplete: () => void;
  pausaGlobale: boolean;
}) {
  const secondi = row.target_tempo_sec ?? 30;
  const { remaining, setInPausa } = useCountdown(secondi, row.id, true, { tick, finish, onDone: onComplete });

  useEffect(() => {
    setInPausa(pausaGlobale);
  }, [pausaGlobale, setInPausa]);

  return (
    <div className="card flex flex-col items-center gap-3 p-5">
      <span className="text-xs uppercase tracking-wide text-muted">Stretching</span>
      <span className="font-display text-2xl font-semibold">{row.zona_corporea}</span>
      <span className="font-figures text-6xl font-bold tabular-nums text-accent">{remaining}s</span>
    </div>
  );
}
