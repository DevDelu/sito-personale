"use client";

import { useEffect, useRef } from "react";

type WakeLockNavigator = Navigator & {
  wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> };
};

// navigator.wakeLock.request('screen') all'avvio sessione, rilasciato alla
// fine/unmount. Feature detection: su browser senza supporto la sessione
// funziona comunque, solo senza tenere lo schermo acceso.
//
// La Wake Lock API rilascia da sola il lock quando il documento diventa
// `hidden` (cambio app, blocco manuale, screen timeout) e NON lo riacquisisce
// da sola al ritorno: senza il listener sotto, dopo un solo cambio app lo
// schermo tornava a spegnersi per il resto della sessione.
export function useWakeLock(active: boolean) {
  const lockRef = useRef<{ release: () => Promise<void> } | null>(null);
  const requestingRef = useRef(false);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    async function request() {
      if (requestingRef.current || lockRef.current) return;
      requestingRef.current = true;
      try {
        const nav = navigator as WakeLockNavigator;
        if (!nav.wakeLock) return;
        const lock = await nav.wakeLock.request("screen");
        if (cancelled) {
          lock.release().catch(() => {});
          return;
        }
        lockRef.current = lock;
      } catch {
        // Negato o non disponibile: nessun impatto sul resto della sessione.
      } finally {
        requestingRef.current = false;
      }
    }

    request();

    function onVisibilityChange() {
      if (document.visibilityState === "visible") request();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      lockRef.current?.release().catch(() => {});
      lockRef.current = null;
    };
  }, [active]);
}
