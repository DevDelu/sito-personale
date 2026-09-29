// Controllo deterministico prima di pubblicare una issue su un repo
// PUBBLICO: la parafrasi scritta da Claude non deve contenere importi, date,
// email, numeri lunghi (IBAN, carte, telefoni) né frasi copiate dal testo
// originale di Lorenzo. Se qualcosa non passa, lo script pubblica un corpo
// generico invece della parafrasi. Nessuna dipendenza: gira sul runner con
// Node e nei test (npm test).

const PATTERN_VIETATI = [
  { motivo: "valuta", re: /[€$£]|\beur(o|i)?\b|\busd\b/i },
  { motivo: "importo", re: /\b\d+(?:[.,]\d{3})*[.,]\d{1,2}\b/ },
  { motivo: "data", re: /\b\d{1,2}[/.-]\d{1,2}(?:[/.-]\d{2,4})?\b|\b\d{4}-\d{2}-\d{2}\b/ },
  {
    motivo: "data",
    re: /\b\d{1,2}\s+(gen|feb|mar|apr|mag|giu|lug|ago|set|ott|nov|dic)[a-z]*\b/i,
  },
  { motivo: "email", re: /[^\s@]+@[^\s@]+\.[a-z]{2,}/i },
  { motivo: "numero lungo", re: /\d[\d\s]{5,}\d/ },
];

const PAROLE_COPIATE = 6;

function parole(testo) {
  return testo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

// true se `pubblico` contiene una sequenza di almeno 6 parole consecutive
// identica al testo originale: significa che non è stato parafrasato.
function copiaDa(originale, pubblico) {
  const orig = parole(originale);
  if (orig.length < PAROLE_COPIATE) return false;
  const pub = ` ${parole(pubblico).join(" ")} `;
  for (let i = 0; i + PAROLE_COPIATE <= orig.length; i++) {
    if (pub.includes(` ${orig.slice(i, i + PAROLE_COPIATE).join(" ")} `)) return true;
  }
  return false;
}

// Restituisce l'elenco dei motivi per cui il testo NON è pubblicabile
// (vuoto = ok).
export function motiviNonPubblicabile(pubblico, originale = "") {
  const motivi = PATTERN_VIETATI.filter(({ re }) => re.test(pubblico)).map(({ motivo }) => motivo);
  if (originale && copiaDa(originale, pubblico)) motivi.push("testo copiato dall'originale");
  return [...new Set(motivi)];
}

// Da riga di comando, per lo sviluppatore notturno prima di pubblicare
// titolo e corpo di una PR (repo pubblico):
//   node .github/scripts/privacy.mjs <file-da-pubblicare> [file-testo-originale]
// Esce con 1 e stampa i motivi se il testo non è pubblicabile.
if (import.meta.url === `file://${process.argv[1]}`) {
  const { readFileSync } = await import("node:fs");
  const [file, originale] = process.argv.slice(2);
  if (!file) {
    console.error("Uso: node .github/scripts/privacy.mjs <file> [file-originale]");
    process.exit(2);
  }
  // Le righe tecniche (id del feedback, issue chiuse) non sono dati personali
  // e un uuid può sembrare un "numero lungo".
  const testo = readFileSync(file, "utf8").replace(/^.*\b(Feedback-id|Closes|Fixes)\b.*$/gim, "");
  const motivi = motiviNonPubblicabile(testo, originale ? readFileSync(originale, "utf8") : "");
  if (motivi.length) {
    console.error(`Non pubblicabile: ${motivi.join(", ")}.`);
    process.exit(1);
  }
  console.log("Ok: pubblicabile.");
}
