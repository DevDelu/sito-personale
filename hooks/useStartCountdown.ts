"use client";

import { useEffect, useRef, useState } from "react";

const POLL_MS = 250;
// Feedback negli ultimi 3s (diverso dai 5s del timer di riposo, useCountdown:
// qui è un conto alla rovescia più breve prima ancora di iniziare, il tick
// ravvicinato serve a "sentire" l'imminenza più che a scandire il tempo).
const TICK_THRESHOLD_SEC = 3;

// Countdown di preparazione pre-allenamento, robusto ai throttling di
// setInterval quando la pagina va in background (schermo bloccato, cambio
// app): non decrementa un contatore ad ogni tick, ma ricalcola il tempo
// rimasto da un timestamp di fine (`endsAt`) confrontato con Date.now() ad
// ogni poll (~250ms). Così, se il browser salta più tick mentre l'app è in
// background, al ritorno il countdown mostra comunque il valore corretto
// invece di essere "indietro". Tick/beep di fine vengono comunque emessi una
// volta sola per ogni secondo attraversato (anche se il poll ne salta
// diversi), scorrendo l'intervallo tra l'ultimo secondo intero noto e quello
// corrente.
export function useStartCountdown(
  initialSeconds: number,
  { tick, finish, onDone }: { tick: () => void; finish: () => void; onDone: () => void }
) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isPaused, setIsPaused] = useState(false);

  // Inizializzato nell'effetto di mount sotto (Date.now() è una chiamata
  // impura, non ammessa durante il render: vedi react-hooks/purity). Da quel
  // momento in poi è sempre assegnato prima che l'interval possa leggerlo.
  const endsAtRef = useRef<number>(0);
  const pausedRemainingMsRef = useRef<number | null>(null);
  const lastWholeSecondRef = useRef(initialSeconds);
  const doneRef = useRef(false);

  const callbacksRef = useRef({ tick, finish, onDone });
  useEffect(() => {
    callbacksRef.current = { tick, finish, onDone };
  });

  useEffect(() => {
    endsAtRef.current = Date.now() + initialSeconds * 1000;

    const interval = setInterval(() => {
      if (doneRef.current || pausedRemainingMsRef.current !== null) return;

      const msLeft = endsAtRef.current - Date.now();
      const secLeft = Math.max(0, Math.ceil(msLeft / 1000));

      if (secLeft !== lastWholeSecondRef.current) {
        // Emette un tick per ogni secondo "negli ultimi 3s" attraversato tra
        // l'ultimo valore noto e quello attuale, anche se il poll ne ha
        // saltati più di uno (ritorno da background).
        for (let s = lastWholeSecondRef.current - 1; s >= secLeft; s--) {
          if (s > 0 && s <= TICK_THRESHOLD_SEC) callbacksRef.current.tick();
        }
        lastWholeSecondRef.current = secLeft;
        setRemaining(secLeft);
      }

      if (secLeft <= 0 && !doneRef.current) {
        doneRef.current = true;
        callbacksRef.current.finish();
        callbacksRef.current.onDone();
      }
    }, POLL_MS);

    return () => clearInterval(interval);
    // Un solo countdown per montaggio del componente: la durata iniziale e i
    // callback vivono nei ref sopra, non servono come dipendenze.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addSeconds(delta: number) {
    if (doneRef.current) return;
    if (pausedRemainingMsRef.current !== null) {
      pausedRemainingMsRef.current += delta * 1000;
    } else {
      endsAtRef.current += delta * 1000;
    }
    const msLeft = pausedRemainingMsRef.current ?? endsAtRef.current - Date.now();
    const secLeft = Math.max(0, Math.ceil(msLeft / 1000));
    lastWholeSecondRef.current = secLeft;
    setRemaining(secLeft);
  }

  // Il calcolo (e le sue chiamate impure a Date.now()) avviene qui, nel
  // gestore dell'evento, non dentro l'updater passato a setIsPaused: gli
  // updater funzionali devono restare puri (react-hooks/purity).
  function togglePause() {
    if (doneRef.current) return;
    if (!isPaused) {
      pausedRemainingMsRef.current = Math.max(0, endsAtRef.current - Date.now());
    } else {
      const remainingMs = pausedRemainingMsRef.current ?? 0;
      endsAtRef.current = Date.now() + remainingMs;
      pausedRemainingMsRef.current = null;
    }
    setIsPaused(!isPaused);
  }

  return { remaining, isPaused, addSeconds, togglePause };
}
