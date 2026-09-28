// Riepilogo dei feedback per la card in cima a /feedback: contatori per
// stato, tempo medio da invio a `verificato`, tasso di riapertura. Funzione
// pura (test in riepilogo.test.ts).
import { FEEDBACK_STATI, type FeedbackStato } from "./types.ts";

export type RigaRiepilogo = { id: string; created_at: string; stato: FeedbackStato; riaperture: number };
export type ChiusuraRiepilogo = { feedback_id: string; created_at: string };

export type Riepilogo = {
  perStato: Record<FeedbackStato, number>;
  totale: number;
  // Giorni (1 decimale) da invio a verificato, sui feedback verificati.
  giorniMediVerifica: number | null;
  // Quota (0-1) dei feedback arrivati almeno a da-verificare che sono stati
  // riaperti almeno una volta.
  tassoRiapertura: number | null;
};

const GIORNO_MS = 24 * 60 * 60 * 1000;

export function calcolaRiepilogo(righe: RigaRiepilogo[], verifiche: ChiusuraRiepilogo[]): Riepilogo {
  const perStato = Object.fromEntries(FEEDBACK_STATI.map((s) => [s, 0])) as Record<FeedbackStato, number>;
  for (const r of righe) perStato[r.stato]++;

  const durate: number[] = [];
  for (const r of righe) {
    if (r.stato !== "verificato") continue;
    // L'ultima verifica conta (dopo eventuali riaperture).
    const ultima = verifiche
      .filter((v) => v.feedback_id === r.id)
      .map((v) => new Date(v.created_at).getTime())
      .sort((a, b) => b - a)[0];
    if (ultima) durate.push(ultima - new Date(r.created_at).getTime());
  }
  const giorniMediVerifica = durate.length
    ? Math.round((durate.reduce((s, d) => s + d, 0) / durate.length / GIORNO_MS) * 10) / 10
    : null;

  const arrivati = righe.filter((r) => r.stato === "da-verificare" || r.stato === "verificato" || r.riaperture > 0);
  const tassoRiapertura = arrivati.length ? arrivati.filter((r) => r.riaperture > 0).length / arrivati.length : null;

  return { perStato, totale: righe.length, giorniMediVerifica, tassoRiapertura };
}

// "3 notti fa": il lavoro sui feedback avviene di notte.
export function etaInNotti(creato: string, adesso: Date = new Date()): string {
  const giorni = Math.floor((adesso.getTime() - new Date(creato).getTime()) / GIORNO_MS);
  if (giorni <= 0) return "stanotte";
  if (giorni === 1) return "1 notte fa";
  return `${giorni} notti fa`;
}
