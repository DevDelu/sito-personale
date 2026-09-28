// Palette per categorie create dinamicamente dall'utente (vedi Modifica 1 /
// app/globals.css). Le categorie "fisse" hanno un colore dedicato assegnato
// via migration SQL (vedi supabase/005_gestione_movimenti.sql); questa
// palette copre invece le categorie aggiunte a runtime dal modal.
//
// Ordine = ordine di assegnazione: prima le tinte più lontane dai blu delle
// categorie fisse (Alimentari, PayPal, Rimborso), così le prime categorie
// nuove non finiscono tutte "azzurre" (feedback 27/09).
const CATEGORY_PALETTE = [
  "--cat-extra-3", // giallo
  "--cat-extra-5", // rosa-rosso
  "--cat-extra-2", // lime
  "--cat-extra-6", // marrone
  "--cat-extra-4", // indaco
  "--cat-extra-7", // fucsia
  "--cat-extra-1", // ciano
] as const;

// Colori delle categorie fisse (stessi nomi di CATEGORY_STYLE in
// lib/category-style.ts), riusati come riserva quando la palette extra è
// esaurita. "Altro" resta grigio e non viene mai dato ad altre categorie.
const COLORI_FISSI: Record<string, string> = {
  Alimentari: "--cat-alimentari",
  Benzina: "--cat-benzina",
  Vinted: "--cat-vinted",
  PayPal: "--cat-paypal",
  Bonifici: "--cat-bonifici",
  Ristoranti: "--cat-ristoranti",
  Stipendio: "--cat-stipendio",
  Rimborso: "--cat-rimborso",
};
const COLORE_ALTRO = "var(--cat-altro)";

const cssVar = (v: string) => `var(${v})`;

// Oltre la palette: tinte generate con l'angolo aureo, sempre diverse tra
// loro. Non seguono il tema chiaro/scuro, ma servono solo da 17 categorie in su.
function coloreGenerato(indice: number): string {
  const hue = Math.round((indice * 137.508 + 20) % 360);
  return `hsl(${hue} 62% 52%)`;
}

// Sceglie il primo colore della palette non ancora usato da nessuna
// categoria esistente; se sono tutti usati, ricicla in round-robin in base
// a quante categorie sono già state create con questa palette. Il grafico
// resta comunque senza doppioni grazie a mappaColoriCategorie.
export function pickCategoryColor(usedColors: Iterable<string | null>): string {
  const used = new Set(usedColors);
  const free = CATEGORY_PALETTE.find((v) => !used.has(cssVar(v)));
  if (free) return cssVar(free);

  const usedExtraCount = [...used].filter((c) =>
    CATEGORY_PALETTE.some((v) => c === cssVar(v))
  ).length;
  return cssVar(CATEGORY_PALETTE[usedExtraCount % CATEGORY_PALETTE.length]);
}

// Un colore diverso per ogni categoria, stabile tra i grafici: tiene il
// colore salvato in DB quando nessun'altra categoria lo usa già, altrimenti
// (colore mancante o doppione) ne assegna uno libero. Le categorie con lo
// stesso nome (es. Vinted spesa ed entrata) condividono il colore, come nel
// grafico a torta dove vengono unite. Ordine deterministico per nome, così
// filtri e periodo non fanno cambiare colore a una categoria.
export function mappaColoriCategorie(
  categorie: { nome: string; colore: string | null }[]
): Map<string, string> {
  const colorePerNome = new Map<string, string | null>();
  for (const c of [...categorie].sort((a, b) => a.nome.localeCompare(b.nome, "it"))) {
    if (!colorePerNome.get(c.nome)) colorePerNome.set(c.nome, c.colore);
  }

  const mappa = new Map<string, string>();
  const usati = new Set<string>([COLORE_ALTRO]);
  if (colorePerNome.has("Altro")) mappa.set("Altro", COLORE_ALTRO);

  // 1. Colori salvati, il primo che li reclama (in ordine di nome) li tiene.
  for (const [nome, colore] of colorePerNome) {
    if (mappa.has(nome) || !colore || usati.has(colore)) continue;
    mappa.set(nome, colore);
    usati.add(colore);
  }

  // 2. Tutte le altre: colore fisso del nome se libero, poi palette extra,
  //    poi i colori fissi avanzati, infine tinte generate.
  const riserva = [...CATEGORY_PALETTE, ...Object.values(COLORI_FISSI)].map(cssVar);
  let generati = 0;
  for (const nome of colorePerNome.keys()) {
    if (mappa.has(nome)) continue;
    const fisso = COLORI_FISSI[nome] ? cssVar(COLORI_FISSI[nome]) : null;
    let colore = fisso && !usati.has(fisso) ? fisso : riserva.find((c) => !usati.has(c));
    while (!colore || usati.has(colore)) colore = coloreGenerato(generati++);
    mappa.set(nome, colore);
    usati.add(colore);
  }
  return mappa;
}
