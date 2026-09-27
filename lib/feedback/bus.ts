"use client";

import type { AttritoEvento, FeedbackOrigine, FeedbackPayload, FeedbackTipo } from "./types";

// Ponte fuori da React tra i punti di accesso al feedback (tab bar, /altro,
// sidebar, scorciatoia F) e il FeedbackProvider montato nel layout privato,
// stesso pattern di lib/allenamento/session-guard.ts.

export type AperturaFeedback = {
  origine: FeedbackOrigine;
  tipo?: FeedbackTipo;
  attrito?: AttritoEvento;
  // Se assente si usa la pagina corrente; /altro passa l'ultima pagina
  // visitata prima di Altro.
  pagina?: string;
};

let apriHandler: ((a: AperturaFeedback) => void) | null = null;
let focusHandler: (() => void) | null = null;

export function registraAperturaFeedback(fn: typeof apriHandler) {
  apriHandler = fn;
}

export function apriFeedback(a: AperturaFeedback) {
  apriHandler?.(a);
}

// iOS apre la tastiera solo se focus() avviene dentro un gesto dell'utente:
// la pressione lunga apre lo sheet dal timer (non è un gesto), il rilascio
// del dito (touchend) chiama questa funzione per dare il focus al campo.
export function registraFocusCampoFeedback(fn: typeof focusHandler) {
  focusHandler = fn;
}

export function focusCampoFeedback() {
  focusHandler?.();
}

// localStorage/sessionStorage possono lanciare (Safari privato, storage
// bloccato): ogni accesso passa da qui, con try/catch e fallback.
function leggi<T>(storage: () => Storage, chiave: string, fallback: T): T {
  try {
    const raw = storage().getItem(chiave);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function scrivi(storage: () => Storage, chiave: string, valore: unknown) {
  try {
    storage().setItem(chiave, JSON.stringify(valore));
  } catch {
    // Storage non disponibile: la funzionalità degrada senza persistenza.
  }
}

const local = () => window.localStorage;
const session = () => window.sessionStorage;

export const leggiLocale = <T,>(chiave: string, fallback: T) => leggi(local, chiave, fallback);
export const scriviLocale = (chiave: string, valore: unknown) => scrivi(local, chiave, valore);

const CHIAVE_ULTIMA_PAGINA = "radar.feedback.ultimaPagina";
export type UltimaPagina = { pagina: string; query_chiavi: string[] };

export function salvaUltimaPagina(v: UltimaPagina) {
  scrivi(session, CHIAVE_ULTIMA_PAGINA, v);
}

export function leggiUltimaPagina(): UltimaPagina | null {
  return leggi<UltimaPagina | null>(session, CHIAVE_ULTIMA_PAGINA, null);
}

// Coda offline: se l'invio fallisce il feedback resta qui e viene reinviato
// al prossimo avvio online. Tetto di 20 per non crescere all'infinito.
const CHIAVE_CODA = "radar.feedback.coda";
const CODA_MAX = 20;

export function accodaFeedback(payload: FeedbackPayload) {
  const coda = leggiLocale<FeedbackPayload[]>(CHIAVE_CODA, []);
  scriviLocale(CHIAVE_CODA, [...coda, payload].slice(-CODA_MAX));
}

export function prendiCodaFeedback(): FeedbackPayload[] {
  const coda = leggiLocale<FeedbackPayload[]>(CHIAVE_CODA, []);
  scriviLocale(CHIAVE_CODA, []);
  return coda;
}
