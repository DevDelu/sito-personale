// npm run check:fb-aree — controllo statico delle aree di feedback (vedi
// lib/feedback/aree.ts e CLAUDE.md > Feedback):
// 1. ogni pagina privata (app/(private)/**/page.tsx) ha almeno un
//    `data-fb-area`, nella pagina stessa o in un file colocato nella sua
//    cartella (es. spese/overview.tsx). Eccezione esplicita: un commento
//    `// fb-aree: <motivo>` per le pagine senza UI (solo redirect);
// 2. ogni area usata nel codice (`data-fb-area="..."`, `area="..."` su
//    <Sheet>, anche dentro espressioni `{cond ? "a" : "b"}`) esiste in
//    lib/feedback/aree.ts;
// 3. ogni modale grezzo (`.modal-overlay` senza <Sheet>) dell'area privata
//    ha un `data-fb-area` sul suo pannello.
// Nessuna dipendenza: gira con Node 22 in CI.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const errori = [];

function file(dir, filtro) {
  const out = [];
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) out.push(...file(p, filtro));
    else if (filtro(p)) out.push(p);
  }
  return out;
}

const rel = (p) => relative(ROOT, p);
const tsx = (p) => p.endsWith(".tsx");

// Chiavi della mappa: righe `"id": "etichetta",` dentro AREE_FEEDBACK.
const sorgenteAree = readFileSync(join(ROOT, "lib/feedback/aree.ts"), "utf8");
const blocco = sorgenteAree.slice(sorgenteAree.indexOf("AREE_FEEDBACK = {"), sorgenteAree.indexOf("} as const"));
const AREE = new Set([...blocco.matchAll(/^\s*"([a-z0-9.-]+)":/gm)].map((m) => m[1]));
if (AREE.size === 0) errori.push("lib/feedback/aree.ts: nessuna area trovata (formato cambiato?)");

const RE_ATTR = /data-fb-area=(?:"([^"]+)"|\{([^}]+)\})/g;
const RE_SHEET_AREA = /<Sheet\b[^>]*?\sarea=(?:"([^"]+)"|\{([^}]+)\})/gs;

function areeUsate(sorgente) {
  const usate = [];
  for (const re of [RE_ATTR, RE_SHEET_AREA]) {
    for (const m of sorgente.matchAll(re)) {
      if (m[1]) usate.push(m[1]);
      // Espressione: le stringhe letterali con la forma di un id d'area
      // (modulo.sezione), non quelle dei confronti (`modalita === "modifica"`).
      // Una variabile senza letterali (es. `area={area}` dentro Sheet.tsx)
      // non si può verificare staticamente e viene saltata.
      else for (const s of m[2].matchAll(/"([a-z0-9-]+\.[a-z0-9.-]+)"/g)) usate.push(s[1]);
    }
  }
  return usate;
}

// 1. Pagine private.
const cartellaPrivata = join(ROOT, "app/(private)");
for (const pagina of file(cartellaPrivata, (p) => p.endsWith("page.tsx"))) {
  const sorgente = readFileSync(pagina, "utf8");
  if (/\/\/ fb-aree: \S/.test(sorgente)) continue;
  const colocati = readdirSync(dirname(pagina))
    .map((n) => join(dirname(pagina), n))
    .filter((p) => tsx(p) && statSync(p).isFile());
  const coperta = colocati.some((p) => /data-fb-area=/.test(readFileSync(p, "utf8")));
  if (!coperta) errori.push(`${rel(pagina)}: nessun data-fb-area (aggiungi un'area alle sezioni principali)`);
}

// 2 + 3. Tutto il codice dell'app (il quiz pubblico è fuori: niente
// feedback nell'area pubblica).
const sorgenti = [...file(join(ROOT, "app"), tsx), ...file(join(ROOT, "components"), tsx)].filter(
  (p) => !rel(p).startsWith("app/[locale]") && !rel(p).startsWith("components/quiz") && !rel(p).startsWith("components/home")
);
for (const p of sorgenti) {
  const sorgente = readFileSync(p, "utf8");
  for (const area of areeUsate(sorgente)) {
    if (!AREE.has(area)) errori.push(`${rel(p)}: area "${area}" non presente in lib/feedback/aree.ts`);
  }
  const overlay = (sorgente.match(/className="modal-overlay/g) ?? []).length;
  if (overlay > 0) {
    const pannelliConArea = (sorgente.match(/data-fb-area=[^>]*className="modal-panel/g) ?? []).length;
    if (pannelliConArea < overlay) {
      errori.push(`${rel(p)}: ${overlay - pannelliConArea} modale/i senza data-fb-area sul .modal-panel`);
    }
  }
}

if (errori.length) {
  console.error(`check:fb-aree — ${errori.length} problemi:\n${errori.map((e) => `  - ${e}`).join("\n")}`);
  process.exit(1);
}
console.log(`check:fb-aree — ok (${AREE.size} aree definite).`);
