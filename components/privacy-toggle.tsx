"use client";

import { useSyncExternalStore } from "react";
import { Eye, EyeOff } from "lucide-react";

// Modalità discreta: sfoca gli importi (classe `.importo`) quando usi Radar
// in pubblico. Preferenza solo sul dispositivo (localStorage); l'attributo
// su <html> è impostato dallo script in app/layout.tsx prima dell'idratazione.
function iscriviti(notifica: () => void) {
  const osservatore = new MutationObserver(notifica);
  osservatore.observe(document.documentElement, { attributes: true, attributeFilter: ["data-privacy"] });
  return () => osservatore.disconnect();
}

export function PrivacyToggle() {
  // La fonte di verità è l'attributo su <html>: il server rende "spento".
  const attiva = useSyncExternalStore(
    iscriviti,
    () => document.documentElement.getAttribute("data-privacy") === "on",
    () => false,
  );

  function cambia() {
    const next = !attiva;
    if (next) document.documentElement.setAttribute("data-privacy", "on");
    else document.documentElement.removeAttribute("data-privacy");
    try {
      if (next) localStorage.setItem("privacy", "on");
      else localStorage.removeItem("privacy");
    } catch {
      // storage non disponibile: vale solo per questa sessione
    }
  }

  return (
    <button
      type="button"
      onClick={cambia}
      role="switch"
      aria-checked={attiva}
      aria-label={attiva ? "Mostra gli importi" : "Nascondi gli importi"}
      className="flex h-[44px] w-[44px] items-center justify-center rounded-full border border-border text-foreground active:scale-90"
    >
      {attiva ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
    </button>
  );
}
