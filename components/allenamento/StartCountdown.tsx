"use client";

import { Pause, Play, SkipForward, Wrench, X } from "lucide-react";
import { useStartCountdown } from "@/hooks/useStartCountdown";

// Schermata fullscreen di countdown prima del primo esercizio: dà il tempo
// di allontanarsi dal telefono e mettersi in posizione, con numero grande
// leggibile da un paio di metri. Componente a sé stante (non logica sparsa
// nella schermata live), riusa gli stessi beep/vibrazione del timer di
// riposo (tick/finish passati dal chiamante, stesso AudioContext condiviso
// per tutta la sessione).
export function StartCountdown({
  seconds,
  stepLabel,
  stepDetail,
  attrezzatura,
  tick,
  finish,
  onDone,
  onCancel,
}: {
  seconds: number;
  stepLabel: string;
  stepDetail: string;
  attrezzatura: string[];
  tick: () => void;
  finish: () => void;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { remaining, isPaused, addSeconds, togglePause } = useStartCountdown(seconds, {
    tick,
    finish,
    onDone,
  });

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">Si parte con</span>
        <h1 className="font-display text-2xl font-semibold">{stepLabel}</h1>
        <p className="text-sm text-muted">{stepDetail}</p>
        {attrezzatura.length > 0 && (
          <p className="flex items-center gap-1.5 text-sm text-accent">
            <Wrench className="h-3.5 w-3.5 shrink-0" />
            Prepara: {attrezzatura.join(", ")}
          </p>
        )}
      </div>

      <span className="font-figures text-8xl font-bold tabular-nums text-accent" aria-live="polite">
        {remaining}
      </span>

      {isPaused && <span className="text-sm font-medium text-muted">In pausa</span>}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={onDone} className="btn-secondary flex items-center gap-1.5">
          <SkipForward className="h-3.5 w-3.5" />
          Salta
        </button>
        <button type="button" onClick={() => addSeconds(10)} className="btn-secondary">
          +10s
        </button>
        <button type="button" onClick={togglePause} className="btn-secondary flex items-center gap-1.5">
          {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          {isPaused ? "Riprendi" : "Pausa"}
        </button>
        <button type="button" onClick={onCancel} className="btn-danger flex items-center gap-1.5">
          <X className="h-3.5 w-3.5" />
          Annulla
        </button>
      </div>
    </div>
  );
}
