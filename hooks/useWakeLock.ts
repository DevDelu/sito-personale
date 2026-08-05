"use client";

import { useEffect, useRef } from "react";

type WakeLockNavigator = Navigator & {
  wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> };
};

// navigator.wakeLock.request('screen') all'avvio sessione, rilasciato alla
// fine/unmount. Feature detection: su browser senza supporto la sessione
// funziona comunque, solo senza tenere lo schermo acceso.
export function useWakeLock(active: boolean) {
  const lockRef = useRef<{ release: () => Promise<void> } | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    async function request() {
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
      }
    }

    request();

    return () => {
      cancelled = true;
      lockRef.current?.release().catch(() => {});
      lockRef.current = null;
    };
  }, [active]);
}
