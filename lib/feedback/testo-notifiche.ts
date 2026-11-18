// Testo delle notifiche "cose da fare per te" sui feedback. Pura e testata.
// Solo i due stati che aspettano davvero Lorenzo: una domanda di un agente
// e una modifica online da verificare. Le PR da approvare stanno nel
// resoconto del turno (molte le mergia il giro da solo).

import type { FeedbackStato } from "./types";
import type { EventoAutore } from "./types";

export type TestoNotifica = { title: string; body: string; url: string; tag: string };

export function notificaPerCambio(
  stato: FeedbackStato,
  autore: EventoAutore,
  inAttesa: number
): TestoNotifica | null {
  // Le azioni di Lorenzo non gli notificano niente: le ha fatte lui.
  if (autore === "lorenzo" || inAttesa < 1) return null;
  if (stato === "serve-info") {
    return {
      title: inAttesa === 1 ? "Un agente ha una domanda per te" : `${inAttesa} domande degli agenti per te`,
      body: "Rispondi in Feedback, così il lavoro va avanti stanotte.",
      url: "/feedback",
      // Stesso tag: una nuova notifica sostituisce la precedente invece di
      // accumularsi (il conteggio è già aggiornato).
      tag: "feedback-domande",
    };
  }
  if (stato === "da-verificare") {
    return {
      title: inAttesa === 1 ? "Una modifica da verificare" : `${inAttesa} modifiche da verificare`,
      body: "Quello che avevi segnalato è online: apri la pagina e dimmi se è sistemato.",
      url: "/feedback",
      tag: "feedback-verifiche",
    };
  }
  return null;
}
