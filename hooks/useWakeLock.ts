"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
// `isSupported`/`isActive` servono a mostrare un indicatore discreto
// (WakeLockIndicator): chi si allena deve capire se lo schermo resterà acceso.
export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinelLike | null>(null);
  const requestingRef = useRef(false);
  const cancelledRef = useRef(false);
  const [isActive, setIsActive] = useState(false);
  const [isSupported] = useState(() => typeof navigator !== "undefined" && "wakeLock" in navigator);

  // Stabile (usa solo ref): i componenti possono metterla nelle dipendenze
  // dei loro effetti senza riattivarli a ogni render.
  const request = useCallback(async () => {
    if (requestingRef.current || lockRef.current) return;
    requestingRef.current = true;
    try {
      const nav = navigator as WakeLockNavigator;
      if (!nav.wakeLock) return;
      const lock = await nav.wakeLock.request("screen");
      if (cancelledRef.current) {
        lock.release().catch(() => {});
        return;
      }
      lockRef.current = lock;
      lock.addEventListener("release", () => {
        // Rilasciato dal browser (schermo spento, cambio app): lo stato resta onesto.
        if (lockRef.current === lock) lockRef.current = null;
        setIsActive(false);
      });
      setIsActive(true);
    } catch {
      // Negato o non disponibile: nessun impatto sul resto della sessione.
    } finally {
      requestingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    cancelledRef.current = false;

    // setState dentro request() avviene solo dopo l'await della richiesta
    // (mai in modo sincrono nell'effetto): la regola non lo distingue.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    request();

    function onVisibilityChange() {
      if (document.visibilityState === "visible") request();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelledRef.current = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      lockRef.current?.release().catch(() => {});
      lockRef.current = null;
      setIsActive(false);
    };
  }, [active, request]);

  // Esposto per essere chiamato direttamente dentro un handler di click:
  // iOS Safari richiede che navigator.wakeLock.request() parta nello stesso
  // turno sincrono del gesto utente, non da un useEffect innescato dal
  // cambio di stato (stesso motivo per cui qui accanto audio.unlock() viene
  // chiamato nel click e non in un effetto). L'effetto sopra resta comunque
  // la rete di sicurezza per il riaggancio dopo un cambio app.
  return { requestNow: request, isSupported, isActive };
}
