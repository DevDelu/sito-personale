// Indice della Scuola: moduli in ordine di studio e lezioni. Si parte dal
// funzionamento dei mercati (per capire notizie e commenti), poi aziende e
// macro, quindi l'analisi tecnica, strumenti e testa, e infine il
// linguaggio per discuterne.

import { LEZIONI_MERCATI } from "./lezioni-mercati.ts";
import { LEZIONI_STRUMENTI } from "./lezioni-strumenti.ts";
import { LEZIONI_TECNICA } from "./lezioni-tecnica.ts";
import type { Lezione, ModuloId } from "./tipi";

export type { Blocco, Domanda, Lezione, ModuloId } from "./tipi";

export const MODULI: { id: ModuloId; titolo: string; descrizione: string }[] = [
  { id: "mercati", titolo: "Come funzionano i mercati", descrizione: "Borsa, ordini, indici, ETF, settori" },
  { id: "aziende", titolo: "Aziende e bilanci", descrizione: "Trimestrali, utili, multipli" },
  { id: "macro", titolo: "Macro, tassi e banche centrali", descrizione: "Fed, BCE, obbligazioni, dati, ciclo, valute" },
  { id: "tecnica-base", titolo: "Analisi tecnica · Fondamenta", descrizione: "Candele, trend, livelli, trendline, volumi" },
  { id: "tecnica-indicatori", titolo: "Analisi tecnica · Indicatori", descrizione: "Medie, RSI, MACD, Bollinger, Fibonacci" },
  { id: "tecnica-operativa", titolo: "Analisi tecnica · Operatività", descrizione: "Pattern, rischio, piano di trading" },
  { id: "strumenti", titolo: "Strumenti, portafoglio e testa", descrizione: "Sentiment, derivati, portafoglio, psicologia, tasse" },
  { id: "linguaggio", titolo: "Parlare di mercati", descrizione: "Gergo, discorsi della Fed, notizie, discussioni" },
];

const ORDINE = new Map(MODULI.map((m, i) => [m.id, i]));

// Ordine di studio: per modulo, poi nell'ordine in cui le lezioni sono scritte.
export const LEZIONI: Lezione[] = [...LEZIONI_MERCATI, ...LEZIONI_TECNICA, ...LEZIONI_STRUMENTI]
  .map((l, i) => ({ l, i }))
  .sort((a, b) => ORDINE.get(a.l.modulo)! - ORDINE.get(b.l.modulo)! || a.i - b.i)
  .map(({ l }) => l);

export function modulo(id: ModuloId) {
  return MODULI.find((m) => m.id === id)!;
}

export function lezione(slug: string) {
  return LEZIONI.find((l) => l.slug === slug);
}

export function adiacenti(slug: string) {
  const i = LEZIONI.findIndex((l) => l.slug === slug);
  return { precedente: i > 0 ? LEZIONI[i - 1] : null, successiva: i >= 0 && i < LEZIONI.length - 1 ? LEZIONI[i + 1] : null };
}
