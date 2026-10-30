"use client";

import { useCallback, useSyncExternalStore } from "react";
import { leggiSfere, raccogli } from "@/lib/sfere/conteggio";

const CHIAVE = "sfere-drago";
const EVENTO = "sfere-drago:cambio";

function leggiRaw(): string {
  try {
    return window.localStorage.getItem(CHIAVE) ?? "";
  } catch {
    return "";
  }
}

function iscriviti(cb: () => void) {
  window.addEventListener(EVENTO, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENTO, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Sfere raccolte, solo nel browser (localStorage, nessun dato al server). */
export function useSfere() {
  const raw = useSyncExternalStore(iscriviti, leggiRaw, () => "");
  const raccolte = leggiSfere(raw);
  const prendi = useCallback((n: number) => {
    try {
      const nuove = raccogli(leggiSfere(leggiRaw()), n);
      window.localStorage.setItem(CHIAVE, JSON.stringify(nuove));
      window.dispatchEvent(new Event(EVENTO));
    } catch {
      /* storage non disponibile: l'easter egg semplicemente non salva */
    }
  }, []);
  return { raccolte, prendi };
}
