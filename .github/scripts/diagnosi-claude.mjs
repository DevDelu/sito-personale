// Perché `claude -p` non ha finito, in UNA riga sicura per un log pubblico:
// l'output di Claude contiene ragionamenti sul testo privato dei feedback,
// quindi non si stampa mai, se ne ricava solo una categoria.
//
//   node diagnosi-claude.mjs <file-output> <exit-code>

import { readFileSync } from "node:fs";

const CATEGORIE = [
  { re: /usage limit|rate limit|quota|credit balance|too many requests|\b429\b/i, motivo: "limite di utilizzo o quota esaurita" },
  {
    re: /invalid api key|authenticat|unauthori[sz]ed|\b401\b|\b403\b|oauth|expired|please run \/login|not logged in|setup-token/i,
    motivo: "autenticazione fallita: CLAUDE_CODE_OAUTH_TOKEN scaduto o non valido (rigeneralo con `claude setup-token`)",
  },
  { re: /max(imum)? turns|reached max/i, motivo: "raggiunto il limite di turni (--max-turns)" },
  { re: /ENOTFOUND|ECONNRESET|ETIMEDOUT|network|fetch failed/i, motivo: "errore di rete verso l'API" },
];

export function classificaErrore(output, codice) {
  const trovata = CATEGORIE.find(({ re }) => re.test(output ?? ""));
  return trovata ? trovata.motivo : `errore non riconosciuto (codice di uscita ${codice})`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let output = "";
  try {
    output = readFileSync(process.argv[2], "utf8");
  } catch {
    // File assente: resta la categoria generica col codice di uscita.
  }
  console.log(classificaErrore(output, process.argv[3] ?? "?"));
}
