// Job notturno "feedback → issue" (radar-feedback-notte.yml). Due fasi,
// eseguite in step separati dello stesso job:
//
//   node feedback-notte.mjs scarica   → legge i feedback `nuovo` da
//        /api/feedback/agente e li scrive in .radar-tmp/feedback.json
//   (in mezzo: Claude legge quel file e scrive .radar-tmp/proposte.json con
//        titolo e parafrasi, senza token GitHub né rete)
//   node feedback-notte.mjs pubblica  → per ogni feedback crea la issue
//        `dal-lorenzo` (con controllo privacy) e segna il feedback
//        `in-lavorazione` con il numero della issue
//
// Il repo è PUBBLICO: questo script non stampa mai il testo dei feedback
// nei log, solo id, conteggi e numeri di issue.

import { mkdirSync, readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import { motiviNonPubblicabile } from "./privacy.mjs";

const DIR = ".radar-tmp";
const FILE_FEEDBACK = `${DIR}/feedback.json`;
const FILE_PROPOSTE = `${DIR}/proposte.json`;
const ETICHETTA = "dal-lorenzo";
const MARCATORE = (id) => `<!-- feedback-id: ${id} -->`;

const { RADAR_URL, FEEDBACK_AGENTE_SECRET, GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_OUTPUT } = process.env;
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
      Authorization: `Bearer ${richiedi("FEEDBACK_AGENTE_SECRET", FEEDBACK_AGENTE_SECRET)}`,
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

async function scarica() {
  const { feedback } = await radar("GET", "/api/feedback/agente?stato=nuovo");
  mkdirSync(DIR, { recursive: true });
  writeFileSync(FILE_FEEDBACK, JSON.stringify(feedback, null, 2));
  console.log(`Feedback nuovi: ${feedback.length}`);
  output("quanti", feedback.length);
}

const TIPO = { problema: "Problema", complicato: "Complicato", idea: "Idea" };

function contestoTecnico(f) {
  const c = f.contesto ?? {};
  const righe = [
    `- **Pagina**: \`${f.pagina}\` · **Origine**: ${f.origine} · **Viewport**: ${c.viewport ?? "?"} · **Tema**: ${c.tema ?? "?"}`,
  ];
  if (c.versione) righe.push(`- **Versione**: \`${String(c.versione).slice(0, 7)}\``);
  if (c.query_chiavi?.length) righe.push(`- **Filtri attivi (solo chiavi)**: ${c.query_chiavi.map((k) => `\`${k}\``).join(", ")}`);
  // Degli attriti si pubblicano solo tipo e, per errore_api, metodo + route
  // template + status (già senza id): i messaggi di errore JS possono
  // contenere dati, restano in Supabase.
  const attriti = [c.attrito, ...(c.attriti_recenti ?? [])].filter(Boolean);
  const visti = new Set();
  for (const a of attriti) {
    const riga =
      a.tipo === "errore_api" && /^[A-Z]+ \/[\w/[\]-]* \d{3}$/.test(a.dettaglio ?? "")
        ? `\`${a.tipo}\` ${a.dettaglio}`
        : `\`${a.tipo}\` su \`${a.pagina}\``;
    visti.add(riga);
  }
  if (visti.size) righe.push(`- **Attriti recenti**: ${[...visti].slice(0, 5).join("; ")}`);
  return righe.join("\n");
}

function corpoIssue(f, proposta) {
  const parti = [`**Tipo**: ${TIPO[f.tipo] ?? f.tipo}`];
  if (proposta) {
    parti.push("", "### Cosa segnala Lorenzo (parafrasato)", proposta.descrizione.trim());
    if (proposta.dove_guardare?.trim()) parti.push("", "### Dove guardare", proposta.dove_guardare.trim());
  } else {
    parti.push(
      "",
      "### Cosa segnala Lorenzo",
      "_Parafrasi non pubblicabile automaticamente (mancante o con possibili dati personali). " +
        "Il testo originale è nella tabella `feedback` su Supabase, con l'id indicato sotto._"
    );
  }
  parti.push("", "### Contesto tecnico", contestoTecnico(f), "", `_Feedback id: \`${f.id}\`_`, MARCATORE(f.id));
  return parti.join("\n");
}

function titoloIssue(f, proposta) {
  const base = proposta?.titolo?.trim() || `${TIPO[f.tipo] ?? "Feedback"} su ${f.pagina}`;
  return base.replace(/\s+/g, " ").slice(0, 90);
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

async function pubblica() {
  const feedback = JSON.parse(readFileSync(FILE_FEEDBACK, "utf8"));
  let proposte = [];
  if (existsSync(FILE_PROPOSTE)) {
    try {
      proposte = JSON.parse(readFileSync(FILE_PROPOSTE, "utf8"));
    } catch {
      console.log("proposte.json non valido: uso il corpo generico per tutti.");
    }
  } else {
    console.log("proposte.json assente: uso il corpo generico per tutti.");
  }

  await github("POST", "/labels", {
    name: ETICHETTA,
    color: "7a1f3d",
    description: "Feedback lasciato da Lorenzo dall'app (job notturno)",
  });

  let create = 0;
  let generiche = 0;
  for (const f of feedback) {
    const p = Array.isArray(proposte) ? proposte.find((x) => x?.id === f.id) : null;
    let proposta = null;
    if (p && typeof p.titolo === "string" && typeof p.descrizione === "string") {
      const pubblico = [p.titolo, p.descrizione, p.dove_guardare ?? ""].join("\n");
      const motivi = motiviNonPubblicabile(pubblico, f.testo);
      if (motivi.length === 0) proposta = p;
      else console.log(`Feedback ${f.id}: parafrasi scartata (${motivi.join(", ")}).`);
    }
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
    await radar("PATCH", "/api/feedback/agente", { id: f.id, stato: "in-lavorazione", issue_number: numero });
  }
  console.log(`Issue create: ${create} (con corpo generico: ${generiche}).`);
}

const fase = process.argv[2];
if (fase === "scarica") await scarica();
else if (fase === "pubblica") await pubblica();
else {
  console.error("Uso: node feedback-notte.mjs scarica|pubblica");
  process.exit(1);
}
