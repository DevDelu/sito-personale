// Cosa vede Lorenzo in /feedback: per ogni feedback la fase del percorso,
// una frase su cosa succede adesso e se tocca a lui. Unica fonte per card,
// dettaglio e scheda "Per te". Nessun import con alias: usata anche dai
// test node:test.
//
//   1 Ricevuto → 2 In lavorazione → 3 Da approvare → 4 Da verificare → 5 Chiuso
//
// "Da approvare" è `in-lavorazione` con una PR aperta: la modifica è pronta
// e aspetta il merge di Lorenzo. Lo stato nel database non cambia.
import type { FeedbackRow, FeedbackStato } from "./types.ts";

export const PASSI = ["Ricevuto", "In lavorazione", "Da approvare", "Da verificare", "Chiuso"] as const;

export type Fase = {
  // Indice in PASSI (0-4).
  passo: number;
  etichetta: string;
  adesso: string;
  // true = serve un'azione di Lorenzo (scheda "Per te", badge ambra).
  perTe: boolean;
};

export function fase(f: Pick<FeedbackRow, "stato" | "pr_number" | "riaperture">): Fase {
  const s: FeedbackStato = f.stato;
  switch (s) {
    case "nuovo":
      return {
        passo: 0,
        etichetta: "Ricevuto",
        adesso: "Salvato parola per parola. L'agente lo prende nel prossimo giro (stanotte, o quando lo avvii tu).",
        perTe: false,
      };
    case "preso-in-carico":
      return {
        passo: 1,
        etichetta: "In coda",
        adesso: "L'agente l'ha letto e ci lavora nel prossimo giro.",
        perTe: false,
      };
    case "riaperto":
      return {
        passo: 1,
        etichetta: "Riaperto",
        adesso: `Hai detto che non è sistemato${f.riaperture > 1 ? ` (${f.riaperture} volte)` : ""}: ha la precedenza nel prossimo giro.`,
        perTe: false,
      };
    case "serve-info":
      return {
        passo: 1,
        etichetta: "Serve una tua risposta",
        adesso: "L'agente ha una domanda: rispondi e riparte.",
        perTe: true,
      };
    case "in-lavorazione":
      return f.pr_number
        ? {
            passo: 2,
            etichetta: "Da approvare",
            adesso: `La modifica è pronta nella PR #${f.pr_number}: aprila, prova l'anteprima e, se va bene, fai Merge. Dopo il deploy te la chiedo da verificare.`,
            perTe: true,
          }
        : {
            passo: 1,
            etichetta: "In lavorazione",
            adesso: "L'agente sta preparando la modifica.",
            perTe: false,
          };
    case "da-verificare":
      return {
        passo: 3,
        etichetta: "Da verificare",
        adesso: "È online. Provala sul sito: se è sistemato tocca Verificato, altrimenti Non risolto.",
        perTe: true,
      };
    case "verificato":
      return { passo: 4, etichetta: "Verificato", adesso: "Chiuso: hai confermato che è sistemato.", perTe: false };
    case "scartato":
      return { passo: 4, etichetta: "Scartato", adesso: "Chiuso senza modifiche.", perTe: false };
  }
}

export type Scheda = "per-te" | "in-corso" | "chiusi";

export function scheda(f: Pick<FeedbackRow, "stato" | "pr_number" | "riaperture">): Scheda {
  if (f.stato === "verificato" || f.stato === "scartato") return "chiusi";
  return fase(f).perTe ? "per-te" : "in-corso";
}
