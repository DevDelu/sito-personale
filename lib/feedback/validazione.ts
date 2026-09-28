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
import { isAreaFeedback } from "./aree";
import { validaEntita, validaPunto } from "./punto";

// Il body arriva dal client (anche da una coda offline vecchia di giorni):
// si tiene solo ciò che lo schema prevede, con limiti di lunghezza, e il
// template della pagina viene ricalcolato qui invece di fidarsi del client.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID.test(v);
}

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
  const scroll = typeof o.scroll_y === "number" && Number.isFinite(o.scroll_y) ? Math.round(o.scroll_y) : null;
  return {
    query_chiavi: chiavi
      .filter((k): k is string => typeof k === "string")
      .slice(0, 20)
      .map((k) => k.slice(0, 40)),
    viewport: o.viewport === "desktop" ? "desktop" : "mobile",
    tema: o.tema === "scuro" ? "scuro" : "chiaro",
    scroll_y: scroll === null ? null : Math.min(100, Math.max(0, scroll)),
    attrito: attrito(o.attrito),
    attriti_recenti: recenti
      .slice(-10)
      .map(attrito)
      .filter((a): a is AttritoEvento => a !== null),
  };
}

// Path reale + query: resta solo in Supabase (mai su GitHub). Deve essere
// un path dell'app, non un URL esterno ("Vai al punto" lo apre).
function url(v: unknown): string | null {
  const s = stringa(v, 500);
  return s && s.startsWith("/") && !s.startsWith("//") ? s : null;
}

export function validaFeedback(body: unknown): FeedbackPayload | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const testo = typeof o.testo === "string" ? o.testo.trim() : "";
  if (!testo || testo.length > FEEDBACK_TESTO_MAX) return null;
  if (!FEEDBACK_TIPI.includes(o.tipo as FeedbackPayload["tipo"])) return null;
  if (!FEEDBACK_ORIGINI.includes(o.origine as FeedbackPayload["origine"])) return null;
  // `pagina` è il nome del campo prima della migration 033: una coda
  // offline vecchia può ancora contenerlo.
  const route = stringa(o.route, 200) ?? stringa(o.pagina, 200) ?? "/";
  return {
    route: paginaTemplate(route),
    url: url(o.url),
    area: isAreaFeedback(o.area) && o.area !== "feedback.sheet" ? o.area : null,
    entita: validaEntita(o.entita),
    punto: validaPunto(o.punto),
    tipo: o.tipo as FeedbackPayload["tipo"],
    testo,
    origine: o.origine as FeedbackPayload["origine"],
    contesto: contesto(o.contesto),
    nota_per: isUuid(o.nota_per) ? o.nota_per : null,
  };
}
