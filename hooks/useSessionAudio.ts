"use client";

import { useCallback, useRef } from "react";

type AudioContextCtor = typeof AudioContext;

// Beep generati con AudioContext + oscillatore, nessun file audio esterno.
// L'AudioContext va creato/sbloccato al primo tap dell'utente (gesture
// richiesta dai browser mobile) e riusato per tutta la sessione: crearne uno
// nuovo per ogni timer non funzionerebbe su iOS/Android senza un nuovo gesture.
export function useSessionAudio() {
  const ctxRef = useRef<AudioContext | null>(null);

  const unlock = useCallback(() => {
    if (ctxRef.current) return;
    const Ctor: AudioContextCtor | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
    if (!Ctor) return;
    ctxRef.current = new Ctor();
  }, []);

  const beep = useCallback((frequency: number, startOffset: number, duration: number) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const start = ctx.currentTime + startOffset;
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(0.2, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }, []);

  // Tick breve: ultimi 3 secondi di ogni timer.
  const tick = useCallback(() => beep(880, 0, 0.08), [beep]);

  // Fine timer: due toni ascendenti + vibrazione (con feature detection).
  const finish = useCallback(() => {
    beep(660, 0, 0.16);
    beep(990, 0.18, 0.22);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  }, [beep]);

  return { unlock, tick, finish };
}
