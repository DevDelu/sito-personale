// Markdown minimo per i resoconti degli agenti, trasformato in una struttura
// dati che il componente rende con elementi React: niente HTML interpretato,
// niente MDX (che eseguirebbe codice), link solo http(s) o interni.
// Supporta: titoli #/##/###, elenchi - * e 1., paragrafi, **grassetto**,
// `codice`, [link](url), separatore ---.

export type Pezzo =
  | { tipo: "testo"; testo: string }
  | { tipo: "grassetto"; testo: string }
  | { tipo: "codice"; testo: string }
  | { tipo: "link"; testo: string; href: string };

export type Blocco =
  | { tipo: "titolo"; livello: 2 | 3 | 4; pezzi: Pezzo[] }
  | { tipo: "paragrafo"; pezzi: Pezzo[] }
  | { tipo: "elenco"; ordinato: boolean; voci: Pezzo[][] }
  | { tipo: "separatore" };

export function hrefSicuro(href: string): string | null {
  const h = href.trim();
  if (/^https?:\/\//i.test(h)) return h;
  if (h.startsWith("/") && !h.startsWith("//")) return h;
  return null;
}

export function pezziInline(riga: string): Pezzo[] {
  const pezzi: Pezzo[] = [];
  const re = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let ultimo = 0;
  for (const m of riga.matchAll(re)) {
    if (m.index > ultimo) pezzi.push({ tipo: "testo", testo: riga.slice(ultimo, m.index) });
    if (m[1] !== undefined) pezzi.push({ tipo: "grassetto", testo: m[1] });
    else if (m[2] !== undefined) pezzi.push({ tipo: "codice", testo: m[2] });
    else {
      const href = hrefSicuro(m[4]);
      pezzi.push(href ? { tipo: "link", testo: m[3], href } : { tipo: "testo", testo: m[3] });
    }
    ultimo = m.index + m[0].length;
  }
  if (ultimo < riga.length) pezzi.push({ tipo: "testo", testo: riga.slice(ultimo) });
  return pezzi;
}

export function leggiMarkdown(testo: string): Blocco[] {
  const blocchi: Blocco[] = [];
  let paragrafo: string[] = [];
  let elenco: { ordinato: boolean; voci: Pezzo[][] } | null = null;

  const chiudi = () => {
    if (paragrafo.length) blocchi.push({ tipo: "paragrafo", pezzi: pezziInline(paragrafo.join(" ")) });
    if (elenco) blocchi.push({ tipo: "elenco", ...elenco });
    paragrafo = [];
    elenco = null;
  };

  for (const grezza of testo.split(/\r?\n/)) {
    const riga = grezza.trim();
    if (!riga) {
      chiudi();
      continue;
    }
    const titolo = riga.match(/^(#{1,3})\s+(.+)$/);
    if (titolo) {
      chiudi();
      blocchi.push({ tipo: "titolo", livello: (titolo[1].length + 1) as 2 | 3 | 4, pezzi: pezziInline(titolo[2]) });
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(riga)) {
      chiudi();
      blocchi.push({ tipo: "separatore" });
      continue;
    }
    const voce = riga.match(/^([-*•]|\d+[.)])\s+(.+)$/);
    if (voce) {
      const ordinato = /\d/.test(voce[1]);
      if (paragrafo.length || (elenco && elenco.ordinato !== ordinato)) chiudi();
      elenco ??= { ordinato, voci: [] };
      elenco.voci.push(pezziInline(voce[2]));
      continue;
    }
    if (elenco) chiudi();
    paragrafo.push(riga);
  }
  chiudi();
  return blocchi;
}
