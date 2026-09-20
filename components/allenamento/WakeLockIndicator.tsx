"use client";

import { AlertTriangle, Monitor } from "lucide-react";

// Indicatore discreto (non bloccante, nessun modale) dello stato del wake
// lock durante la sessione live: conferma che lo schermo resta acceso, o
// avvisa senza interrompere l'allenamento se l'API non è supportata o la
// richiesta è stata negata (es. risparmio energetico attivo).
export function WakeLockIndicator({ isSupported, isActive }: { isSupported: boolean; isActive: boolean }) {
  if (isActive) {
    return (
      <div className="pointer-events-none fixed right-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-40 flex items-center gap-1.5 rounded-full border border-border bg-surface/80 px-2.5 py-1 text-xs text-muted backdrop-blur-sm">
        <Monitor className="h-3.5 w-3.5 shrink-0" />
        Schermo attivo
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed right-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-40 flex items-center gap-1.5 rounded-full border border-border bg-surface/80 px-2.5 py-1 text-xs text-muted backdrop-blur-sm">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      {isSupported ? "Lo schermo potrebbe spegnersi" : "Wake lock non supportato: lo schermo potrebbe spegnersi"}
    </div>
  );
}
