export const FEEDBACK_TIPI = ["problema", "complicato", "idea"] as const;
export type FeedbackTipo = (typeof FEEDBACK_TIPI)[number];

export const FEEDBACK_ORIGINI = ["tab", "suggerimento", "altro", "desktop", "pulsante"] as const;
export type FeedbackOrigine = (typeof FEEDBACK_ORIGINI)[number];

export const FEEDBACK_STATI = ["nuovo", "in-lavorazione", "risolto", "scartato"] as const;
export type FeedbackStato = (typeof FEEDBACK_STATI)[number];

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

export type FeedbackContesto = {
  query_chiavi: string[];
  viewport: "mobile" | "desktop";
  tema: "chiaro" | "scuro";
  // Impostata lato server da VERCEL_GIT_COMMIT_SHA, mai dal client.
  versione?: string | null;
  attrito?: AttritoEvento | null;
  attriti_recenti?: AttritoEvento[];
};

export type FeedbackPayload = {
  pagina: string;
  tipo: FeedbackTipo;
  testo: string;
  origine: FeedbackOrigine;
  contesto: FeedbackContesto;
};

export type FeedbackRow = FeedbackPayload & {
  id: string;
  created_at: string;
  stato: FeedbackStato;
  issue_number: number | null;
  pr_number: number | null;
};

export const FEEDBACK_TESTO_MAX = 500;
