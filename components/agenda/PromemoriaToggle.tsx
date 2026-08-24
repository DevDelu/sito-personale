"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { useAgendaMutations } from "@/hooks/useAgendaMutations";

// Interruttore compatto per il promemoria email delle 9:00 (solo nei giorni
// in cui esiste una nota, vedi app/api/agenda/note-reminder/route.ts):
// icona sola con stato riflesso dal colore, nessun testo permanente per non
// aggiungere ingombro accanto al badge di sync.
export function PromemoriaToggle({ attivoIniziale }: { attivoIniziale: boolean }) {
  const router = useRouter();
  const { impostaPromemoriaNote } = useAgendaMutations();
  const [attivo, setAttivo] = useState(attivoIniziale);
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    const nuovo = !attivo;
    try {
      await impostaPromemoriaNote(nuovo);
      setAttivo(nuovo);
      router.refresh();
    } catch {
      // errore ignorato qui: stato locale non cambia, l'utente può riprovare
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={attivo ? "Disattiva promemoria note ore 9" : "Attiva promemoria note ore 9"}
      title={attivo ? "Promemoria note (ore 9) attivo" : "Promemoria note (ore 9) disattivato"}
      className="btn-icon"
    >
      {attivo ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5 text-muted/60" />}
    </button>
  );
}
