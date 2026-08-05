"use client";

import { useEffect, useState } from "react";
import { useCountdown } from "@/hooks/useCountdown";
import type { SchedaEsercizioConNome } from "@/lib/allenamento/types";

// Timer automatico lavoro/pausa per `rounds` cicli (es. Corda: 8x 40s
// lavoro / 15s pausa). Nessuna pausa dopo l'ultimo round di lavoro.
export function SessionRowCircuito({
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
  const rounds = row.rounds ?? 1;
  const lavoroSec = row.lavoro_sec ?? 30;
  const pausaSec = row.pausa_sec ?? 0;

  const [round, setRound] = useState(1);
  const [fase, setFase] = useState<"lavoro" | "pausa">("lavoro");

  const secondiFase = fase === "lavoro" ? lavoroSec : pausaSec;

  const { remaining, setInPausa } = useCountdown(secondiFase, `${round}-${fase}`, true, {
    tick,
    finish,
    onDone: () => {
      if (fase === "lavoro") {
        if (round >= rounds) {
          onComplete();
          return;
        }
        if (pausaSec > 0) setFase("pausa");
        else setRound((r) => r + 1);
      } else {
        setRound((r) => r + 1);
        setFase("lavoro");
      }
    },
  });

  useEffect(() => {
    setInPausa(pausaGlobale);
  }, [pausaGlobale, setInPausa]);

  return (
    <div className="card flex flex-col items-center gap-3 p-5">
      <div className="text-center">
        <span className="font-display text-lg font-semibold">{row.esercizio_nome}</span>
        <p className="text-sm text-muted">
          Round {round} di {rounds} · {fase === "lavoro" ? "lavoro" : "pausa"}
        </p>
      </div>
      <span
        className={`font-figures text-6xl font-bold tabular-nums ${fase === "lavoro" ? "text-accent" : "text-muted"}`}
      >
        {remaining}s
      </span>
    </div>
  );
}
