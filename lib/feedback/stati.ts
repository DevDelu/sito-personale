// Stati del feedback e matrice delle transizioni, condivisa da tutte le
// route e Server Action che cambiano uno stato (vedi CLAUDE.md > Feedback).
// Nessun import con alias: usata anche dai test node:test.
//
//   nuovo → preso-in-carico → in-lavorazione → da-verificare → verificato
//                  ↓                ↓               ↓
//             serve-info ←──────────┘           riaperto → preso-in-carico
//   qualsiasi stato aperto → scartato (solo Lorenzo)
import type { EventoAutore, FeedbackStato } from "./types.ts";

export const STATI_APERTI: readonly FeedbackStato[] = [
  "nuovo",
  "preso-in-carico",
  "serve-info",
  "in-lavorazione",
  "riaperto",
];
export const STATI_CHIUSI: readonly FeedbackStato[] = ["verificato", "scartato"];

export function isAperto(stato: FeedbackStato): boolean {
  return STATI_APERTI.includes(stato);
}

// "Non ancora chiuso": aperti + da-verificare. Serve a scartare e a
// contare le segnalazioni già presenti su una pagina.
export function isNonChiuso(stato: FeedbackStato): boolean {
  return !STATI_CHIUSI.includes(stato);
}

type Transizione = { da: FeedbackStato; a: FeedbackStato; autori: readonly EventoAutore[] };

const TRANSIZIONI: readonly Transizione[] = [
  { da: "nuovo", a: "preso-in-carico", autori: ["agente"] },
  { da: "preso-in-carico", a: "serve-info", autori: ["agente"] },
  { da: "preso-in-carico", a: "in-lavorazione", autori: ["agente"] },
  { da: "in-lavorazione", a: "serve-info", autori: ["agente"] },
  // PR collegata chiusa senza merge: il feedback torna in coda.
  { da: "in-lavorazione", a: "preso-in-carico", autori: ["agente"] },
  // Solo dopo merge E deploy di produzione riuscito (feedback-deploy.yml).
  { da: "in-lavorazione", a: "da-verificare", autori: ["sistema"] },
  // Lorenzo ha risposto alla domanda dell'agente.
  { da: "serve-info", a: "preso-in-carico", autori: ["lorenzo"] },
  { da: "da-verificare", a: "verificato", autori: ["lorenzo"] },
  { da: "da-verificare", a: "riaperto", autori: ["lorenzo"] },
  { da: "riaperto", a: "preso-in-carico", autori: ["agente"] },
  // La PR sul feedback riaperto può arrivare prima del job notturno.
  { da: "riaperto", a: "in-lavorazione", autori: ["agente"] },
  ...(["nuovo", "preso-in-carico", "serve-info", "in-lavorazione", "riaperto", "da-verificare"] as const).map(
    (da) => ({ da, a: "scartato" as const, autori: ["lorenzo"] as const })
  ),
];

// Stati che un autore non può MAI impostare, qualunque sia lo stato di
// partenza: le route rispondono 403 invece di 409.
const MAI: Record<EventoAutore, readonly FeedbackStato[]> = {
  agente: ["verificato", "scartato", "da-verificare", "riaperto", "nuovo"],
  sistema: ["verificato", "scartato", "riaperto", "nuovo", "preso-in-carico", "serve-info", "in-lavorazione"],
  lorenzo: ["serve-info", "in-lavorazione", "da-verificare", "nuovo"],
};

export type EsitoTransizione =
  | { ok: true }
  | { ok: false; motivo: "vietato"; messaggio: string }
  | { ok: false; motivo: "non-valida"; messaggio: string };

export function verificaTransizione(da: FeedbackStato, a: FeedbackStato, autore: EventoAutore): EsitoTransizione {
  if (MAI[autore].includes(a)) {
    return { ok: false, motivo: "vietato", messaggio: `${autore} non può impostare lo stato ${a}.` };
  }
  const t = TRANSIZIONI.find((x) => x.da === da && x.a === a);
  if (!t || !t.autori.includes(autore)) {
    return { ok: false, motivo: "non-valida", messaggio: `Transizione ${da} → ${a} non consentita a ${autore}.` };
  }
  return { ok: true };
}

export const ETICHETTA_STATO: Record<FeedbackStato, string> = {
  nuovo: "Inviato",
  "preso-in-carico": "Preso in carico",
  "serve-info": "Serve una tua risposta",
  "in-lavorazione": "In lavorazione",
  "da-verificare": "Da verificare",
  verificato: "Verificato",
  riaperto: "Riaperto",
  scartato: "Scartato",
};
