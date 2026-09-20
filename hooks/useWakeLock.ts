"use client";

import { useEffect, useRef, useState } from "react";

type WakeLockSentinelLike = {
  release: () => Promise<void>;
  addEventListener: (type: "release", listener: () => void) => void;
  removeEventListener: (type: "release", listener: () => void) => void;
};

type WakeLockNavigator = Navigator & {
  wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> };
};

// navigator.wakeLock.request('screen') all'avvio sessione, rilasciato alla
// fine/unmount. Feature detection: su browser senza supporto la sessione
// funziona comunque, solo senza tenere lo schermo acceso.
//
// La Wake Lock API rilascia da sola il lock quando il documento diventa
// `hidden` (cambio app, blocco manuale, screen timeout) e NON lo riacquisisce
// da sola al ritorno: senza il listener sotto, dopo un solo cambio app lo
// schermo tornava a spegnersi per il resto della sessione.
//
// `isSupported`/`isActive` sono esposti per mostrare un indicatore discreto
// nella UI (vedi WakeLockIndicator): l'utente deve poter capire se lo
// schermo resterà davvero acceso, specialmente su iOS dove la PWA installata
// ha avuto storicamente dei bug con questa API su versioni datate.
export function useWakeLock(active: boolean): { isSupported: boolean; isActive: boolean } {
  const lockRef = useRef<WakeLockSentinelLike | null>(null);
  const requestingRef = useRef(false);
  const [isActive, setIsActive] = useState(false);
  // Non cambia durante la vita del componente: nessun bisogno di stato o
  // effetto, una lazy init basta (e la sua unica lettura, prima di ogni
  // richiesta effettiva, non può disallinearsi dall'HTML SSR — vedi sotto).
  const [isSupported] = useState(() => typeof navigator !== "undefined" && "wakeLock" in navigator);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    function onRelease() {
      // Sentinel rilasciato (dal browser o da noi): tiene lo stato allineato
      // così l'indicatore non mostra "attivo" quando in realtà non lo è più.
      setIsActive(false);
      lockRef.current = null;
    }

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
        lock.addEventListener("release", onRelease);
        setIsActive(true);
      } catch {
        // Negato o non disponibile: nessun impatto sul resto della sessione.
        setIsActive(false);
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
      lockRef.current?.removeEventListener("release", onRelease);
      lockRef.current?.release().catch(() => {});
      lockRef.current = null;
      setIsActive(false);
    };
  }, [active]);

  return { isSupported, isActive };
}
