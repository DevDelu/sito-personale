"use client";

import { useCallback, useSyncExternalStore } from "react";

// Lezioni completate della Scuola di trading. Comodità per un solo lettore
// su un solo dispositivo: vive in localStorage (niente tabella né
// migration), e se lo storage non è disponibile semplicemente non ricorda.
const CHIAVE = "radar.trading.completate";
const EVENTO = "radar-trading-progressi";
const VUOTO = "[]";

function leggi(): string {
  try {
    return localStorage.getItem(CHIAVE) ?? VUOTO;
  } catch {
    return VUOTO;
  }
}

function iscriviti(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENTO, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENTO, callback);
  };
}

export function useProgressiTrading() {
  const grezzo = useSyncExternalStore(iscriviti, leggi, () => VUOTO);
  let completate: string[] = [];
  try {
    const v = JSON.parse(grezzo);
    if (Array.isArray(v)) completate = v.filter((x): x is string => typeof x === "string");
  } catch {
    completate = [];
  }

  const segna = useCallback((slug: string, fatta = true) => {
    try {
      const attuali = new Set<string>(JSON.parse(leggi()));
      if (fatta) attuali.add(slug);
      else attuali.delete(slug);
      localStorage.setItem(CHIAVE, JSON.stringify([...attuali]));
      window.dispatchEvent(new Event(EVENTO));
    } catch {
      // Storage pieno o bloccato (navigazione privata): nessun progresso salvato.
    }
  }, []);

  return { completate, segna };
}
