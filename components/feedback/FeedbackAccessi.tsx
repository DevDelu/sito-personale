"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, MessageSquare } from "lucide-react";
import { ListRowButton } from "@/components/ui/ListGroup";
import { FAB } from "@/components/ui/FAB";
import { apriFeedback } from "@/lib/feedback/bus";

// Accessi visibili di riserva al feedback (il principale è la pressione
// lunga sulla tab attiva, vedi components/shell/TabBar.tsx).

// Riga in /altro ("Segnala un problema o un'idea" diviso in titolo e
// sottotitolo: intero verrebbe troncato a 375px). La pagina allegata è l'ultima visitata prima di Altro,
// la risolve FeedbackProvider.
export function FeedbackRigaAltro() {
  return (
    <ListRowButton
      onClick={() => apriFeedback({ origine: "altro" })}
      icon={<MessageSquare className="h-5 w-5" strokeWidth={1.75} />}
      title="Segnala un problema"
      subtitle="O un'idea · anche tenendo premuta la tab"
    />
  );
}

// Voce in fondo alla sidebar desktop, con la scorciatoia F ricordata a lato.
export function FeedbackVoceSidebar() {
  return (
    <button
      type="button"
      onClick={() => apriFeedback({ origine: "desktop" })}
      className="mb-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
    >
      <MessageSquare className="h-4 w-4" strokeWidth={1.75} />
      <span className="flex-1 text-left">Feedback</span>
      <kbd className="rounded border border-border px-1.5 font-mono text-[11px] text-muted">F</kbd>
    </button>
  );
}

// Link alla pagina /feedback, sotto la voce "Feedback" della sidebar desktop.
export function FeedbackLinkSidebar() {
  const pathname = usePathname();
  const attivo = pathname === "/feedback";
  return (
    <Link
      href="/feedback"
      aria-current={attivo ? "page" : undefined}
      className={`mb-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-foreground ${
        attivo ? "text-foreground" : "text-muted"
      }`}
    >
      <Inbox className="h-4 w-4" strokeWidth={1.75} />
      <span className="flex-1 text-left">I miei feedback</span>
    </Link>
  );
}

// Pulsante flottante dedicato (solo mobile), in Spese al posto del vecchio
// FAB "+" che duplicava il "+" centrale della tab bar.
export function FeedbackFAB() {
  return (
    <FAB
      onClick={() => apriFeedback({ origine: "pulsante" })}
      label="Lascia un feedback"
      icon={<MessageSquare className="h-6 w-6" strokeWidth={2} />}
    />
  );
}
