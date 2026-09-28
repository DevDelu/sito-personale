"use client";

import { isAreaFeedback } from "./aree";
import { paginaTemplate } from "./pagina";
import { etichettaSenzaCifre, percentualeScroll, ruoloElemento, validaEntita } from "./punto";
import type { FeedbackPunto } from "./types";

// Cattura automatica del contesto all'apertura dello sheet di feedback, e
// "Indica il punto". Solo attributi data-fb-* e metadati: mai testo della
// pagina oltre all'etichetta (senza cifre) dell'elemento indicato.

export type ContestoCatturato = {
  route: string;
  url: string;
  area: string | null;
  entita: string | null;
  scroll_y: number;
};

const SEL_AREA = "[data-fb-area]";
const SEL_ENTITA = "[data-fb-entita]";
// Lo sheet di feedback stesso non è mai l'area di un feedback.
const SEL_PANNELLO = '.modal-panel[data-fb-area]:not([data-fb-area="feedback.sheet"])';

function area(el: Element | null): string | null {
  const v = el?.closest(SEL_AREA)?.getAttribute("data-fb-area");
  return isAreaFeedback(v) ? v : null;
}

function entita(el: Element | null): string | null {
  return validaEntita(el?.closest(SEL_ENTITA)?.getAttribute("data-fb-entita"));
}

// Area: il modale/Sheet aperto più in alto se c'è (con la sua entità, sul
// pannello o sull'elemento al centro del pannello), altrimenti l'area più
// visibile al centro dello schermo.
export function catturaContesto(): ContestoCatturato {
  // Solo pannelli visibili (un modale nascosto con CSS non conta).
  const pannelli = Array.from(document.querySelectorAll(SEL_PANNELLO)).filter((p) => p.getClientRects().length > 0);
  const pannello = pannelli.at(-1) ?? null;
  let a: string | null = null;
  let e: string | null = null;
  if (pannello) {
    a = area(pannello);
    const r = pannello.getBoundingClientRect();
    const centro = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    e = validaEntita(pannello.getAttribute("data-fb-entita")) ?? (pannello.contains(centro) ? entita(centro) : null);
  } else {
    const centro = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    a = area(centro);
    e = entita(centro);
  }
  return {
    route: paginaTemplate(window.location.pathname),
    url: `${window.location.pathname}${window.location.search}`.slice(0, 500),
    area: a,
    entita: e,
    scroll_y: percentualeScroll(window.scrollY, document.documentElement.scrollHeight, window.innerHeight),
  };
}

// Elemento "significativo" sotto il dito: il controllo interattivo più
// vicino se c'è, altrimenti l'elemento stesso.
function significativo(el: Element): Element {
  return el.closest("button, a, input, textarea, select, [role=button], [role=tab], [role=link], tr, li") ?? el;
}

function etichettaDi(el: Element): string {
  const aria = el.getAttribute("aria-label") ?? el.getAttribute("title") ?? el.getAttribute("placeholder");
  if (aria) return etichettaSenzaCifre(aria);
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
    const label = el.labels?.[0]?.textContent;
    if (label) return etichettaSenzaCifre(label);
  }
  // Righe e card: il titolo interno, non tutto il testo (che conterrebbe
  // importi e date, comunque già senza cifre).
  const titolo = el.matches("tr, li, .card") ? el.querySelector("h1, h2, h3, h4, strong, th") : null;
  return etichettaSenzaCifre((titolo ?? el).textContent);
}

// Valore tra virgolette in un selettore d'attributo: bastano " e \.
const quota = (v: string | null) => (v ?? "").replace(/["\\]/g, "\\$&");

// Selettore stabile: data-testid se presente, altrimenti un percorso breve
// ancorato all'area (e all'entità, se c'è) con nth-of-type per i livelli
// intermedi. L'id dell'entità resta solo in Supabase (mai su GitHub).
export function selettoreStabile(el: Element): string {
  const testid = el.closest("[data-testid]")?.getAttribute("data-testid");
  if (testid) return `[data-testid="${quota(testid)}"]`;

  const radici: string[] = [];
  const areaEl = el.closest(SEL_AREA);
  if (areaEl) radici.push(`[data-fb-area="${quota(areaEl.getAttribute("data-fb-area"))}"]`);
  const entitaEl = el.closest(SEL_ENTITA);
  if (entitaEl && (!areaEl || areaEl.contains(entitaEl))) {
    radici.push(`[data-fb-entita="${quota(entitaEl.getAttribute("data-fb-entita"))}"]`);
  }

  // Dall'elemento risale fino all'ancora più vicina (entità o area), al
  // massimo 4 livelli: se non la raggiunge, gli ultimi 2 come discendenti.
  const ancora = entitaEl ?? areaEl;
  const passi: string[] = [];
  let cur: Element | null = el;
  while (cur && cur !== ancora && passi.length < 4) {
    const corrente: Element = cur;
    const fratelli = corrente.parentElement
      ? Array.from(corrente.parentElement.children).filter((c) => c.tagName === corrente.tagName)
      : [];
    const tag = corrente.tagName.toLowerCase();
    passi.unshift(fratelli.length > 1 ? `${tag}:nth-of-type(${fratelli.indexOf(corrente) + 1})` : tag);
    cur = corrente.parentElement;
  }
  const raggiunta = cur === ancora;
  const coda = raggiunta ? passi.join(" > ") : passi.slice(-2).join(" > ");
  const base = radici.join(" ");
  if (!coda) return base || el.tagName.toLowerCase();
  return (base ? `${base}${raggiunta && ancora ? " > " : " "}${coda}` : coda).slice(0, 300);
}

export type PuntoCatturato = { punto: FeedbackPunto; area: string | null; entita: string | null };

export function catturaPunto(target: Element, x: number, y: number): PuntoCatturato {
  const el = significativo(target);
  const punto: FeedbackPunto = {
    ruolo: ruoloElemento({
      tag: el.tagName,
      role: el.getAttribute("role"),
      type: el.getAttribute("type"),
      inGrafico: !!target.closest("svg, .recharts-wrapper"),
      inRiga: el.matches("tr, li") || !!el.closest(SEL_ENTITA),
      inCard: !!el.closest(".card"),
    }),
    etichetta: etichettaDi(el),
    selettore: selettoreStabile(el),
    posizione: {
      x: Math.round((x / window.innerWidth) * 1000) / 10,
      y: Math.round((y / window.innerHeight) * 1000) / 10,
    },
  };
  return { punto, area: area(el), entita: entita(el) };
}

// Evidenzia per 2 secondi l'elemento indicato (contorno ambra): prima
// dell'avviso di verifica e da "Vai al punto". Restituisce false se
// l'elemento non c'è (pagina cambiata, dato eliminato).
export function evidenziaPunto(selettore: string, durataMs = 2000): boolean {
  let el: HTMLElement | null = null;
  try {
    el = document.querySelector<HTMLElement>(selettore);
  } catch {
    return false;
  }
  if (!el) return false;
  el.scrollIntoView({ block: "center", behavior: "smooth" });
  const prima = { outline: el.style.outline, offset: el.style.outlineOffset, radius: el.style.borderRadius };
  el.style.outline = "3px solid #f59e0b";
  el.style.outlineOffset = "2px";
  if (!prima.radius) el.style.borderRadius = "6px";
  const target = el;
  setTimeout(() => {
    target.style.outline = prima.outline;
    target.style.outlineOffset = prima.offset;
    target.style.borderRadius = prima.radius;
  }, durataMs);
  return true;
}
