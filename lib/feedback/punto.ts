// Funzioni pure per "Indica il punto" e per la cattura del contesto:
// niente DOM qui (quello sta in lib/feedback/cattura.ts), così sono
// verificate da punto.test.ts e riusate lato server per ripulire ciò che
// arriva dal client.
import { PUNTO_RUOLI, type FeedbackPunto, type PuntoRuolo } from "./types.ts";

export const ETICHETTA_MAX = 60;

// Etichetta dell'elemento toccato: niente importi né numeri di nessun tipo
// (ogni cifra diventa #), spazi compattati, max 60 caratteri.
export function etichettaSenzaCifre(testo: string | null | undefined): string {
  return (testo ?? "")
    .replace(/\d/g, "#")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, ETICHETTA_MAX);
}

// Descrizione minima dell'elemento, ricavata dal DOM in cattura.ts.
export type DescrizioneElemento = {
  tag: string;
  role?: string | null;
  type?: string | null;
  // true se dentro un grafico (svg Recharts / .recharts-wrapper).
  inGrafico?: boolean;
  // true se è (o sta dentro) una riga di tabella/lista con data-fb-entita.
  inRiga?: boolean;
  // true se è una card (.card o simili).
  inCard?: boolean;
};

export function ruoloElemento(d: DescrizioneElemento): PuntoRuolo {
  const tag = d.tag.toLowerCase();
  const role = (d.role ?? "").toLowerCase();
  if (tag === "button" || role === "button" || role === "tab" || role === "radio" || role === "switch") return "bottone";
  if (tag === "a" || role === "link") return "link";
  if (["input", "textarea", "select"].includes(tag) || role === "textbox" || role === "combobox") {
    return d.type === "submit" || d.type === "button" ? "bottone" : "campo";
  }
  if (d.inGrafico || tag === "svg" || tag === "canvas") return "grafico";
  if (d.inRiga || tag === "tr" || tag === "li" || role === "row") return "riga";
  if (d.inCard) return "card";
  if (/^h[1-6]$/.test(tag)) return "titolo";
  if (tag === "img") return "immagine";
  if (["p", "span", "td", "th", "label", "strong", "em"].includes(tag)) return "testo";
  return "altro";
}

function numero(v: unknown, min: number, max: number): number | null {
  return typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v * 10) / 10)) : null;
}

// Il punto arriva dal client (anche da una coda offline vecchia): si tiene
// solo ciò che lo schema prevede e l'etichetta viene ripulita di nuovo.
export function validaPunto(v: unknown): FeedbackPunto | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const ruolo = PUNTO_RUOLI.includes(o.ruolo as PuntoRuolo) ? (o.ruolo as PuntoRuolo) : "altro";
  const pos = (o.posizione && typeof o.posizione === "object" ? o.posizione : {}) as Record<string, unknown>;
  const selettore = typeof o.selettore === "string" ? o.selettore.slice(0, 300) : "";
  if (!selettore) return null;
  return {
    ruolo,
    etichetta: etichettaSenzaCifre(typeof o.etichetta === "string" ? o.etichetta : ""),
    selettore,
    posizione: { x: numero(pos.x, 0, 100) ?? 50, y: numero(pos.y, 0, 100) ?? 50 },
  };
}

// `tipo:id` (es. transazione:uuid, asset:IE00B4L5Y983): tipo in minuscolo
// con trattini, id senza spazi. Nient'altro.
export function validaEntita(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const m = /^([a-z][a-z-]{0,39}):([\w.-]{1,80})$/.exec(v.trim());
  return m ? `${m[1]}:${m[2]}` : null;
}

// Solo il tipo dell'entità, l'unica parte che può finire su GitHub.
export function tipoEntita(entita: string | null | undefined): string | null {
  return entita ? (validaEntita(entita)?.split(":")[0] ?? null) : null;
}

export function percentualeScroll(scrollY: number, altezzaPagina: number, altezzaViewport: number): number {
  const scorribile = altezzaPagina - altezzaViewport;
  if (scorribile <= 0) return 0;
  return Math.round(Math.min(100, Math.max(0, (scrollY / scorribile) * 100)));
}
