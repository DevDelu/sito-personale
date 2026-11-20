"use client";

import type { AttritoEvento } from "@/lib/feedback/types";
import { sbloccaAudio } from "./audio";

// Ponte fuori da React tra chi apre l'assistente (pulsante centrale della
// tab bar, invito dopo un errore) e AssistenteHost nel layout privato,
// stesso pattern di lib/feedback/bus.ts.

export type AperturaAssistente = {
  // Pagina su cui si trovava Lorenzo: contesto per i feedback a voce.
  pagina: string;
  // Presente se l'apertura nasce da un errore appena successo.
  attrito?: AttritoEvento;
};

let handler: ((a: AperturaAssistente) => void) | null = null;

export function registraAperturaAssistente(fn: typeof handler) {
  handler = fn;
}

// Da chiamare dentro un onClick: sblocca l'audio nel gesto (vedi audio.ts).
export function apriAssistente(a: AperturaAssistente) {
  sbloccaAudio();
  handler?.(a);
}
