"use client";

import { useSyncExternalStore } from "react";

// Legge la modalità discreta (attributo `data-privacy` su <html>, vedi
// components/privacy-toggle.tsx). Serve dove l'importo finisce in un testo
// (aria-label) che il CSS `.importo` non può sfocare.
function iscriviti(notifica: () => void) {
  const osservatore = new MutationObserver(notifica);
  osservatore.observe(document.documentElement, { attributes: true, attributeFilter: ["data-privacy"] });
  return () => osservatore.disconnect();
}

export function useModalitaDiscreta(): boolean {
  return useSyncExternalStore(
    iscriviti,
    () => document.documentElement.getAttribute("data-privacy") === "on",
    () => false,
  );
}
