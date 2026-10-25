"use client";

import { useEffect } from "react";

// Registra il service worker minimo (public/sw.js) che rende il sito
// installabile come PWA. Nessun elemento in output: solo un effetto.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Registrazione service worker fallita", error);
    });

    // Il numero sull'icona (impostato da sw.js a ogni push) si azzera quando
    // l'app torna in primo piano. API assente o negata: nessun effetto.
    const azzeraBadge = () => {
      if (document.visibilityState !== "visible") return;
      if (!("clearAppBadge" in navigator)) return;
      navigator.clearAppBadge().catch(() => {});
    };
    azzeraBadge();
    document.addEventListener("visibilitychange", azzeraBadge);
    window.addEventListener("focus", azzeraBadge);
    return () => {
      document.removeEventListener("visibilitychange", azzeraBadge);
      window.removeEventListener("focus", azzeraBadge);
    };
  }, []);

  return null;
}
