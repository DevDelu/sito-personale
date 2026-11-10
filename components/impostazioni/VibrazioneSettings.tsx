"use client";

import { useSyncExternalStore } from "react";
import { tocca } from "@/lib/haptics";

const CHIAVE = "vibrazione";

// Interruttore del tocco aptico: salvato solo in localStorage di questo dispositivo.
const ascoltatori = new Set<() => void>();

function iscrivi(cb: () => void) {
  ascoltatori.add(cb);
  return () => {
    ascoltatori.delete(cb);
  };
}

function leggi(): boolean {
  try {
    return window.localStorage.getItem(CHIAVE) !== "off";
  } catch {
    return true;
  }
}

export function VibrazioneSettings() {
  const attiva = useSyncExternalStore(iscrivi, leggi, () => true);

  function cambia() {
    const nuova = !attiva;
    try {
      window.localStorage.setItem(CHIAVE, nuova ? "on" : "off");
    } catch {
      // vale solo per questa visita
    }
    ascoltatori.forEach((cb) => cb());
    if (nuova) tocca();
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={attiva}
      onClick={cambia}
      className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border px-4 text-left active:opacity-70"
    >
      <span className="text-[17px] md:text-sm">Tocco aptico</span>
      <span className={`text-sm ${attiva ? "text-accent" : "text-muted"}`}>{attiva ? "Attivo" : "Spento"}</span>
    </button>
  );
}
