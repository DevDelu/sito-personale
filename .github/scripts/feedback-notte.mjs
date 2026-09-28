// Job notturno feedback (radar-feedback-notte.yml). Due fasi, eseguite in
// step separati dello stesso job:
//
//   node feedback-notte.mjs scarica   → legge da /api/feedback/agente:
//        - i feedback `nuovo`              → .radar-tmp/feedback.json
//        - i feedback `riaperto`           → .radar-tmp/riaperti.json
//        - note/risposte di Lorenzo non ancora riportate → .radar-tmp/eventi.json
//   (in mezzo: Claude legge feedback.json ed eventi.json e scrive
//        .radar-tmp/proposte.json con titoli e parafrasi, senza token GitHub
//        né rete)
//   node feedback-notte.mjs pubblica  →
//        1. per ogni feedback nuovo crea la issue `dal-lorenzo` (con
//           controllo privacy) e lo segna `preso-in-carico`;
//        2. per ogni feedback riaperto riapre la issue con le etichette
//           `riaperto` (e `ostinato` dalla seconda volta) e lo rimette
//           `preso-in-carico`;
//        3. riporta nella issue le note/risposte di Lorenzo, parafrasate.
//
// Il repo è PUBBLICO: questo script non stampa mai il testo dei feedback
// nei log, solo id, conteggi e numeri di issue.

import { mkdirSync, readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import {
  MARCATORE,
  commentoEvento,
  commentoRiapertura,
  corpoIssue,
  etichetteRiapertura,
  propostaPubblicabile,
  titoloIssue,
} from "./feedback-issue.mjs";

const DIR = ".radar-tmp";
const FILE_FEEDBACK = `${DIR}/feedback.json`;
const FILE_RIAPERTI = `${DIR}/riaperti.json`;
const FILE_EVENTI = `${DIR}/eventi.json`;
const FILE_PROPOSTE = `${DIR}/proposte.json`;
const ETICHETTA = "dal-lorenzo";
const ETICHETTE = [
  { name: ETICHETTA, color: "7a1f3d", description: "Feedback lasciato da Lorenzo dall'app (job notturno)" },
  { name: "riaperto", color: "d93f0b", description: "Lorenzo ha verificato in produzione: non è sistemato" },
  { name: "ostinato", color: "b60205", description: "Riaperto 2+ volte: serve una domanda o una proposta diversa" },
];

const { RADAR_URL, GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_OUTPUT } = process.env;
// Nome storico FEEDBACK_AGENTE_SECRET; FEEDBACK_AGENT_SECRET come alias.
const SECRET = process.env.FEEDBACK_AGENTE_SECRET || process.env.FEEDBACK_AGENT_SECRET;
// Impostata da GitHub Actions; il default serve solo a provarlo altrove.
const GITHUB_API_URL = process.env.GITHUB_API_URL ?? "https://api.github.com";

function richiedi(nome, valore) {
  if (!valore) {
    console.error(`Variabile ${nome} mancante.`);
    process.exit(1);
  }
  return valore;
}

async function radar(metodo, percorso, body) {
  const url = `${richiedi("RADAR_URL", RADAR_URL).replace(/\/$/, "")}${percorso}`;
  const res = await fetch(url, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${richiedi("FEEDBACK_AGENTE_SECRET", SECRET)}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${metodo} ${percorso} → ${res.status}`);
  return res.json();
}

async function github(metodo, percorso, body) {
  const res = await fetch(`${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}${percorso}`, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${richiedi("GITHUB_TOKEN", GITHUB_TOKEN)}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok && !(metodo === "POST" && percorso === "/labels" && res.status === 422)) {
    throw new Error(`GitHub ${metodo} ${percorso} → ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

function output(chiave, valore) {
  if (GITHUB_OUTPUT) appendFileSync(GITHUB_OUTPUT, `${chiave}=${valore}\n`);
}

function leggiJson(file, fallback) {
  if (!existsSync(file)) return fallback;
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function scarica() {
  const { feedback } = await radar("GET", "/api/feedback/agente?stato=nuovo");
  const { feedback: riaperti } = await radar("GET", "/api/feedback/agente?stato=riaperto");
  const { eventi } = await radar("GET", "/api/feedback/agente?eventi=da-riportare");
  mkdirSync(DIR, { recursive: true });
  writeFileSync(FILE_FEEDBACK, JSON.stringify(feedback, null, 2));
  writeFileSync(FILE_RIAPERTI, JSON.stringify(riaperti, null, 2));
  writeFileSync(FILE_EVENTI, JSON.stringify(eventi, null, 2));
  console.log(`Feedback nuovi: ${feedback.length} · riaperti: ${riaperti.length} · note/risposte: ${eventi.length}`);
  // Claude serve solo per parafrasare testi (feedback nuovi e note).
  output("da_parafrasare", feedback.length + eventi.length);
  output("quanti", feedback.length + riaperti.length + eventi.length);
}

async function issueEsistente(id) {
  // Idempotenza: se una notte precedente ha creato la issue ma non è
  // riuscita ad aggiornare lo stato, non se ne crea una seconda.
  for (let pagina = 1; pagina <= 5; pagina++) {
    const issue = await github("GET", `/issues?labels=${ETICHETTA}&state=all&per_page=100&page=${pagina}`);
    const trovata = issue.find((i) => i.body?.includes(MARCATORE(id)));
    if (trovata) return trovata.number;
    if (issue.length < 100) return null;
  }
  return null;
}

async function pubblicaNuovi(feedback, proposte) {
  const issuePerFeedback = new Map();
  let create = 0;
  let generiche = 0;
  for (const f of feedback) {
    const p = proposte.find((x) => x?.id === f.id);
    const { proposta, motivi } = propostaPubblicabile(f, p);
    if (motivi.length) console.log(`Feedback ${f.id}: parafrasi scartata (${motivi.join(", ")}).`);
    if (!proposta) generiche++;

    let numero = await issueEsistente(f.id);
    if (numero) {
      console.log(`Feedback ${f.id}: issue già esistente #${numero}.`);
    } else {
      const issue = await github("POST", "/issues", {
        title: titoloIssue(f, proposta),
        body: corpoIssue(f, proposta),
        labels: [ETICHETTA],
      });
      numero = issue.number;
      create++;
      console.log(`Feedback ${f.id}: creata issue #${numero}.`);
    }
    issuePerFeedback.set(f.id, numero);
    await radar("POST", "/api/feedback/agente", { id: f.id, stato: "preso-in-carico", issue_number: numero });
  }
  console.log(`Issue create: ${create} (con corpo generico: ${generiche}).`);
  return issuePerFeedback;
}

async function pubblicaRiaperti(riaperti) {
  for (const f of riaperti) {
    if (!f.issue_number) {
      console.log(`Feedback ${f.id}: riaperto senza issue, salto.`);
      continue;
    }
    await github("PATCH", `/issues/${f.issue_number}`, { state: "open" });
    await github("POST", `/issues/${f.issue_number}/labels`, { labels: etichetteRiapertura(f) });
    await github("POST", `/issues/${f.issue_number}/comments`, { body: commentoRiapertura(f) });
    await radar("POST", "/api/feedback/agente", { id: f.id, stato: "preso-in-carico" });
    console.log(`Feedback ${f.id}: issue #${f.issue_number} riaperta (riaperture: ${f.riaperture}).`);
  }
}

async function pubblicaEventi(eventi, proposte, issuePerFeedback) {
  const riportati = [];
  for (const e of eventi) {
    const numero = e.issue_number ?? issuePerFeedback.get(e.feedback_id);
    // Feedback ancora senza issue (es. job fallito a metà): riprova domani.
    if (!numero) continue;
    const p = proposte.find((x) => x?.evento_id === e.id);
    await github("POST", `/issues/${numero}/comments`, { body: commentoEvento(e, p?.parafrasi) });
    riportati.push(e.id);
    console.log(`Evento ${e.id}: riportato nella issue #${numero}.`);
  }
  if (riportati.length) await radar("POST", "/api/feedback/agente", { riportati });
}

async function pubblica() {
  const feedback = leggiJson(FILE_FEEDBACK, []);
  const riaperti = leggiJson(FILE_RIAPERTI, []);
  const eventi = leggiJson(FILE_EVENTI, []);
  const proposte = leggiJson(FILE_PROPOSTE, null);
  if (!Array.isArray(proposte)) console.log("proposte.json assente o non valido: uso i testi generici.");
  const lista = Array.isArray(proposte) ? proposte : [];

  for (const etichetta of ETICHETTE) await github("POST", "/labels", etichetta);

  const issuePerFeedback = await pubblicaNuovi(feedback, lista);
  await pubblicaRiaperti(riaperti);
  await pubblicaEventi(eventi, lista, issuePerFeedback);
}

const fase = process.argv[2];
if (fase === "scarica") await scarica();
else if (fase === "pubblica") await pubblica();
else {
  console.error("Uso: node feedback-notte.mjs scarica|pubblica");
  process.exit(1);
}
