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
  }, []);

  return null;
}
