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
      className="flex min-h-11 w-full items-center justify-between gap-3 text-left active:opacity-70"
    >
      <span className="text-[17px] md:text-sm">Tocco aptico</span>
      <span
        aria-hidden
        className={`relative inline-flex h-[31px] w-[51px] shrink-0 items-center rounded-full transition-colors duration-200 motion-reduce:transition-none ${attiva ? "bg-accent" : "bg-border"}`}
      >
        <span
          className={`absolute left-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-transform duration-200 motion-reduce:transition-none ${attiva ? "translate-x-5" : "translate-x-0"}`}
        />
      </span>
    </button>
  );
}
