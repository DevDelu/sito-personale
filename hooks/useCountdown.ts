"use client";

import { useEffect, useRef, useState } from "react";
import { beepDaSuonare, secondiRimasti } from "@/lib/allenamento/countdown";

// Countdown generico in secondi, condiviso da timer di riposo (normale),
// lavoro/pausa (circuito) e zona corporea (stretching). `resetKey` forza il
// riavvio anche quando `seconds` è identico alla fase precedente (es. due
// round di lavoro consecutivi con la stessa durata). `enabled` tiene il
// timer fermo finché non deve davvero partire (es. prima serie non ancora
// completata). Beep negli ultimi 5s, tono+vibrazione di fine gestiti dal
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

  const remainingRef = useRef(remaining);
  useEffect(() => {
    remainingRef.current = remaining;
  }, [remaining]);

  // Orario di fine invece di "-1 a ogni intervallo": con lo schermo bloccato
  // iOS sospende i timer e il conteggio restava indietro. Pausa = si
  // congela il tempo rimasto e, alla ripresa, si riparte da quello.
  useEffect(() => {
    if (!enabled || seconds <= 0) return;

    let fine = Date.now() + remainingRef.current * 1000;
    let inPausaPrima = inPausaRef.current;
    let ultimo = remainingRef.current;
    let finito = false;

    const aggiorna = () => {
      if (finito) return;
      const adesso = Date.now();
      if (inPausaRef.current) {
        inPausaPrima = true;
        return;
      }
      if (inPausaPrima) {
        fine = adesso + remainingRef.current * 1000;
        inPausaPrima = false;
      }
      const rimasti = secondiRimasti(fine, adesso);
      if (rimasti === ultimo) return;
      for (let i = 0; i < beepDaSuonare(ultimo, rimasti).length; i++) callbacksRef.current.tick();
      ultimo = rimasti;
      setRemaining(rimasti);
      if (rimasti <= 0) {
        finito = true;
        clearInterval(interval);
        callbacksRef.current.finish();
        callbacksRef.current.onDone();
      }
    };

    const interval = setInterval(aggiorna, 250);
    const alRientro = () => {
      if (document.visibilityState === "visible") aggiorna();
    };
    document.addEventListener("visibilitychange", alRientro);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", alRientro);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, enabled]);

  return { remaining, inPausa, setInPausa };
}
