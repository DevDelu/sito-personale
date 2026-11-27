"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: { reset: (widget?: string | HTMLElement) => void };
  }
}

// Il token di Turnstile vale una sola volta: il server lo consuma a ogni invio,
// anche quando poi risponde con un errore (password sbagliata, email non
// valida). Senza un token nuovo il tentativo dopo viene respinto dal controllo
// anti-spam. Va chiamato passando lo stato restituito da useActionState.
export function useResetAntispam(esito: unknown) {
  const riferimento = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!esito || !riferimento.current) return;
    try {
      window.turnstile?.reset(riferimento.current);
    } catch {
      // Widget non ancora disegnato: avrà comunque un token nuovo.
    }
  }, [esito]);

  return riferimento;
}
