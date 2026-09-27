import {
  ATTRITO_TIPI,
  FEEDBACK_ORIGINI,
  FEEDBACK_TESTO_MAX,
  FEEDBACK_TIPI,
  type AttritoEvento,
  type FeedbackContesto,
  type FeedbackPayload,
} from "./types";
import { paginaTemplate } from "./pagina";

// Il body arriva dal client (anche da una coda offline vecchia di giorni):
// si tiene solo ciò che lo schema prevede, con limiti di lunghezza, e il
// template della pagina viene ricalcolato qui invece di fidarsi del client.

function stringa(v: unknown, max: number): string | undefined {
  return typeof v === "string" ? v.slice(0, max) : undefined;
}

function attrito(v: unknown): AttritoEvento | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (!ATTRITO_TIPI.includes(o.tipo as AttritoEvento["tipo"])) return null;
  return {
    tipo: o.tipo as AttritoEvento["tipo"],
    pagina: paginaTemplate(stringa(o.pagina, 200) ?? "/"),
    at: stringa(o.at, 40) ?? "",
    dettaglio: stringa(o.dettaglio, 200),
  };
}

function contesto(v: unknown): FeedbackContesto {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const chiavi = Array.isArray(o.query_chiavi) ? o.query_chiavi : [];
  const recenti = Array.isArray(o.attriti_recenti) ? o.attriti_recenti : [];
  return {
    query_chiavi: chiavi
      .filter((k): k is string => typeof k === "string")
      .slice(0, 20)
      .map((k) => k.slice(0, 40)),
    viewport: o.viewport === "desktop" ? "desktop" : "mobile",
    tema: o.tema === "scuro" ? "scuro" : "chiaro",
    attrito: attrito(o.attrito),
    attriti_recenti: recenti
      .slice(-10)
      .map(attrito)
      .filter((a): a is AttritoEvento => a !== null),
  };
}

export function validaFeedback(body: unknown): FeedbackPayload | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const testo = typeof o.testo === "string" ? o.testo.trim() : "";
  if (!testo || testo.length > FEEDBACK_TESTO_MAX) return null;
  if (!FEEDBACK_TIPI.includes(o.tipo as FeedbackPayload["tipo"])) return null;
  if (!FEEDBACK_ORIGINI.includes(o.origine as FeedbackPayload["origine"])) return null;
  return {
    pagina: paginaTemplate(stringa(o.pagina, 200) ?? "/"),
    tipo: o.tipo as FeedbackPayload["tipo"],
    testo,
    origine: o.origine as FeedbackPayload["origine"],
    contesto: contesto(o.contesto),
  };
}
