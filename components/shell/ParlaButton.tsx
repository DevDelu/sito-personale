"use client";

import { usePathname } from "next/navigation";
import { AudioLines } from "lucide-react";
import { apriAssistente } from "@/lib/assistente/bus";

// Slot centrale della tab bar mobile: apre l'assistente a voce sopra la
// pagina corrente e si mette subito in ascolto (vedi AssistenteHost). Ha
// preso il posto di "Aggiungi": spese, pasti e feedback si dicono a voce.
export function ParlaButton() {
  const pathname = usePathname();
  return (
    <button
      type="button"
      // Dentro il tap: sblocca audio e sintesi vocale su iOS (lib/assistente/audio.ts).
      onClick={() => apriAssistente({ pagina: pathname })}
      aria-label="Parla con Radar"
      className="flex flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 active:opacity-60"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <AudioLines className="h-4 w-4" strokeWidth={2.5} />
      </span>
      <span className="app-static text-[11px] leading-none font-medium text-muted">Parla</span>
    </button>
  );
}
