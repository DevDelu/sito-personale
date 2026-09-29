export const FEEDBACK_TIPI = ["problema", "complicato", "idea"] as const;
export type FeedbackTipo = (typeof FEEDBACK_TIPI)[number];

export const FEEDBACK_ORIGINI = ["tab", "suggerimento", "altro", "desktop", "pulsante"] as const;
export type FeedbackOrigine = (typeof FEEDBACK_ORIGINI)[number];

// Stati e transizioni: lib/feedback/stati.ts.
export const FEEDBACK_STATI = [
  "nuovo",
  "preso-in-carico",
  "serve-info",
  "in-lavorazione",
  "da-verificare",
  "verificato",
  "riaperto",
  "scartato",
] as const;
export type FeedbackStato = (typeof FEEDBACK_STATI)[number];

export const EVENTO_AUTORI = ["lorenzo", "agente", "sistema"] as const;
export type EventoAutore = (typeof EVENTO_AUTORI)[number];

export const EVENTO_TIPI = ["cambio-stato", "nota", "domanda", "risposta", "nota-fix"] as const;
export type EventoTipo = (typeof EVENTO_TIPI)[number];

// Attriti rilevati in tempo reale. Oggi il client intercetta solo
// errore_api/errore_js (non serve una tabella eventi); gli altri arrivano
// con il tracciamento d'uso (POTENZIAMENTO 7) e sono già accettati qui.
export const ATTRITO_TIPI = ["rage_click", "dead_click", "errore_api", "errore_js", "form_abbandono"] as const;
export type AttritoTipo = (typeof ATTRITO_TIPI)[number];

export type AttritoEvento = {
  tipo: AttritoTipo;
  pagina: string;
  at: string;
  dettaglio?: string;
};

// "Indica il punto": l'elemento toccato da Lorenzo. Mai importi: l'etichetta
// ha le cifre sostituite da # (lib/feedback/punto.ts), ricontrollata lato
// server.
export const PUNTO_RUOLI = ["bottone", "link", "campo", "grafico", "riga", "card", "titolo", "immagine", "testo", "altro"] as const;
export type PuntoRuolo = (typeof PUNTO_RUOLI)[number];

export type FeedbackPunto = {
  ruolo: PuntoRuolo;
  etichetta: string;
  selettore: string;
  // Percentuale del viewport (0-100).
  posizione: { x: number; y: number };
};

export type FeedbackContesto = {
  query_chiavi: string[];
  viewport: "mobile" | "desktop";
  tema: "chiaro" | "scuro";
  // Percentuale di scroll della pagina all'apertura dello sheet (0-100).
  scroll_y?: number | null;
  // Impostata lato server da VERCEL_GIT_COMMIT_SHA, mai dal client.
  versione?: string | null;
  attrito?: AttritoEvento | null;
  attriti_recenti?: AttritoEvento[];
};

export type FeedbackPayload = {
  route: string;
  url: string | null;
  area: string | null;
  entita: string | null;
  punto: FeedbackPunto | null;
  tipo: FeedbackTipo;
  testo: string;
  origine: FeedbackOrigine;
  contesto: FeedbackContesto;
  // Se presente, il testo diventa una nota su quel feedback aperto (vedi
  // "Evita i doppioni") invece di un feedback nuovo.
  nota_per?: string | null;
};

export type FeedbackRow = Omit<FeedbackPayload, "nota_per"> & {
  id: string;
  created_at: string;
  updated_at: string;
  stato: FeedbackStato;
  issue_number: number | null;
  pr_number: number | null;
  riaperture: number;
};

export type FeedbackEvento = {
  id: string;
  feedback_id: string;
  created_at: string;
  autore: EventoAutore;
  tipo: EventoTipo;
  stato_da: FeedbackStato | null;
  stato_a: FeedbackStato | null;
  testo: string | null;
  riportato_at: string | null;
};

// Alti per la dettatura vocale (migration 034). Prima di 034 il database
// accetta 500/1000: inserisciFeedback() e aggiungiEvento() spezzano il testo
// invece di perderlo (vedi LIMITI_PRIMA_DI_034).
export const FEEDBACK_TESTO_MAX = 5000;
export const EVENTO_TESTO_MAX = 5000;
export const LIMITI_PRIMA_DI_034 = { feedback: 500, evento: 1000 } as const;
