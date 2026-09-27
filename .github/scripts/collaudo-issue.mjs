// Dopo il collaudo notturno: se ci sono test falliti apre (o aggiorna) UNA
// issue `dal-collaudo` con l'elenco, così lo sviluppatore notturno la
// trova; se è tutto verde chiude quella aperta. Repo pubblico: si pubblicano
// solo titolo del test (= pagina) e prima riga dell'errore, e solo se passa
// il controllo privacy (i messaggi possono riportare testo della pagina).
import { readFileSync, existsSync } from "node:fs";
import { motiviNonPubblicabile } from "./privacy.mjs";

const { GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_SERVER_URL, GITHUB_RUN_ID } = process.env;
const API = process.env.GITHUB_API_URL ?? "https://api.github.com";
const ETICHETTA = "dal-collaudo";
const TITOLO = "Collaudo notturno: pagine con problemi";

async function github(metodo, percorso, body) {
  const res = await fetch(`${API}/repos/${GITHUB_REPOSITORY}${percorso}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok && !(percorso === "/labels" && res.status === 422)) throw new Error(`GitHub ${metodo} ${percorso} → ${res.status}`);
  return res.json();
}

function falliti(suite, percorso = []) {
  const out = [];
  for (const s of suite.suites ?? []) out.push(...falliti(s, [...percorso, s.title]));
  for (const spec of suite.specs ?? []) {
    const risultati = spec.tests.flatMap((t) => t.results);
    const ultimo = risultati.at(-1);
    if (ultimo && ultimo.status !== "passed" && ultimo.status !== "skipped") {
      const riga = (ultimo.error?.message ?? "").replace(/\u001b\[[0-9;]*m/g, "").split("\n").find((r) => r.trim()) ?? "";
      out.push({ titolo: spec.title, errore: riga.trim().slice(0, 160) });
    }
  }
  return out;
}

const file = process.argv[2];
if (!existsSync(file)) {
  console.log("Report JSON assente: nessuna issue.");
  process.exit(0);
}
const report = JSON.parse(readFileSync(file, "utf8"));
const elenco = (report.suites ?? []).flatMap((s) => falliti(s));
console.log(`Test falliti: ${elenco.length}`);

const aperte = await github("GET", `/issues?labels=${ETICHETTA}&state=open&per_page=10`);
const esistente = aperte.find((i) => i.title === TITOLO);

if (elenco.length === 0) {
  if (esistente) {
    await github("PATCH", `/issues/${esistente.number}`, { state: "closed", state_reason: "completed" });
    console.log(`Tutto verde: chiusa #${esistente.number}.`);
  }
  process.exit(0);
}

const righe = elenco.map(({ titolo, errore }) => {
  const pubblicabile = errore && motiviNonPubblicabile(errore).length === 0;
  return `- [ ] **${titolo}**${pubblicabile ? `\n  \`${errore.replace(/`/g, "'")}\`` : ""}`;
});
const corpo = [
  "Il collaudo notturno (`tests/e2e/`, iPhone 390×844, utente tester in sola lettura) ha trovato questi problemi:",
  "",
  ...righe,
  "",
  `Esecuzione: ${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`,
  "",
  "_Per riprodurre in locale: `npm run test:e2e` (vedi tests/e2e/README.md). Si chiude da sola quando il collaudo torna verde._",
].join("\n");

await github("POST", "/labels", { name: ETICHETTA, color: "b60205", description: "Trovato dal collaudo automatico notturno" });
if (esistente) {
  await github("PATCH", `/issues/${esistente.number}`, { body: corpo });
  console.log(`Aggiornata #${esistente.number}.`);
} else {
  const issue = await github("POST", "/issues", { title: TITOLO, body: corpo, labels: [ETICHETTA] });
  console.log(`Creata #${issue.number}.`);
}
