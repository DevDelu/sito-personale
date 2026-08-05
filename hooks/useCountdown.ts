"use client";

import { useEffect, useRef, useState } from "react";

// Countdown generico in secondi, condiviso da timer di riposo (normale),
// lavoro/pausa (circuito) e zona corporea (stretching). `resetKey` forza il
// riavvio anche quando `seconds` è identico alla fase precedente (es. due
// round di lavoro consecutivi con la stessa durata). `enabled` tiene il
// timer fermo finché non deve davvero partire (es. prima serie non ancora
// completata). Beep negli ultimi 3s, tono+vibrazione di fine gestiti dal
// chiamante (tick/finish), non qui: l'AudioContext è condiviso per tutta la
// sessione (useSessionAudio), non ricreato per ogni timer.
export function useCountdown(
  seconds: number,
  resetKey: string | number,
  enabled: boolean,
  { tick, finish, onDone }: { tick: () => void; finish: () => void; onDone: () => void }
) {
  const [remaining, setRemaining] = useState(seconds);
  const [inPausa, setInPausa] = useState(false);

  // Pattern "adjust state during render" (react.dev/learn/you-might-not-need-an-effect):
  // resetta il countdown quando resetKey cambia, senza passare da un
  // useEffect — evita un giro di render in più e il warning ESLint su
  // setState chiamato sincronamente dentro un effetto.
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setRemaining(seconds);
    setInPausa(false);
  }

  const inPausaRef = useRef(inPausa);
  useEffect(() => {
    inPausaRef.current = inPausa;
  }, [inPausa]);

  const callbacksRef = useRef({ tick, finish, onDone });
  useEffect(() => {
    callbacksRef.current = { tick, finish, onDone };
  });

  useEffect(() => {
    if (!enabled || seconds <= 0) return;

    const interval = setInterval(() => {
      if (inPausaRef.current) return;
      setRemaining((prev) => {
        const next = prev - 1;
        if (next > 0 && next <= 3) callbacksRef.current.tick();
        if (next <= 0) {
          clearInterval(interval);
          callbacksRef.current.finish();
          callbacksRef.current.onDone();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, enabled]);

  return { remaining, inPausa, setInPausa };
}
