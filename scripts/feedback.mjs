#!/usr/bin/env node
// Legge e aggiorna i feedback di Lorenzo dal sito vero, con il testo
// ORIGINALE completo (non la parafrasi delle issue). Lo usano lo
// sviluppatore notturno (.claude/skills/sviluppatore-feedback/SKILL.md) e
// qualunque sessione Claude Code a cui Lorenzo chiede "cosa ho scritto?".
//
// Serve (env dell'ambiente cloud o .env.local):
//   RADAR_URL               es. https://tuo-dominio.it
//   FEEDBACK_AGENTE_SECRET  stesso valore della env var su Vercel
//                           (FEEDBACK_AGENT_SECRET accettato come alias)
//
// Stampa testi privati: MAI in GitHub Actions (log pubblici) né in issue/PR.
//
//   node scripts/feedback.mjs elenco [aperti|tutti|<stato>]   (default: aperti)
//   node scripts/feedback.mjs mostra <id>                      feedback + storia + contesto
//   node scripts/feedback.mjs json [aperti|tutti|<stato>]      come elenco, in JSON
//   node scripts/feedback.mjs stato <id> <stato> [--issue N] [--pr N] [--testo "..."]
//   node scripts/feedback.mjs domanda <id> "domanda per Lorenzo"   → serve-info

const STATI = ["nuovo", "preso-in-carico", "serve-info", "in-lavorazione", "da-verificare", "verificato", "riaperto", "scartato"];
const CHIUSI = ["verificato", "scartato"];
const ETICHETTA = {
  nuovo: "Inviato",
  "preso-in-carico": "Preso in carico",
  "serve-info": "Serve una risposta di Lorenzo",
  "in-lavorazione": "In lavorazione",
  "da-verificare": "Da verificare",
  verificato: "Verificato",
  riaperto: "Riaperto",
  scartato: "Scartato",
};

const BASE = (process.env.RADAR_URL || process.env.SITO_URL || "").replace(/\/$/, "");
const SECRET = process.env.FEEDBACK_AGENTE_SECRET || process.env.FEEDBACK_AGENT_SECRET;

function esci(messaggio) {
  console.error(messaggio);
  process.exit(1);
}

async function api(metodo, percorso, body) {
  if (!BASE || !SECRET) {
    esci(
      "Mancano RADAR_URL e/o FEEDBACK_AGENTE_SECRET.\n" +
        "Aggiungile alle variabili d'ambiente (ambiente cloud di Claude Code: menu dell'ambiente → Edit)."
    );
  }
  const res = await fetch(`${BASE}${percorso}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const dati = await res.json().catch(() => ({}));
  if (!res.ok) esci(`${metodo} ${percorso} → ${res.status} ${dati.error ?? ""}`);
  return dati;
}

async function lista(filtro = "aperti") {
  if (filtro !== "aperti" && filtro !== "tutti" && !STATI.includes(filtro)) esci(`Filtro non valido: ${filtro}`);
  const stato = filtro === "aperti" ? "tutti" : filtro;
  const { feedback } = await api("GET", `/api/feedback/agente?stato=${stato}`);
  const righe = filtro === "aperti" ? feedback.filter((f) => !CHIUSI.includes(f.stato)) : feedback;
  // Dal più vecchio: è l'ordine in cui vanno lavorati.
  return righe.sort((a, b) => a.created_at.localeCompare(b.created_at));
}

function data(iso) {
  return new Date(iso).toLocaleString("it-IT", { timeZone: "Europe/Rome", dateStyle: "short", timeStyle: "short" });
}

function riga(f) {
  const collegamenti = [f.issue_number && `issue #${f.issue_number}`, f.pr_number && `PR #${f.pr_number}`].filter(Boolean).join(" · ");
  return [
    `● ${f.tipo.toUpperCase()} · ${ETICHETTA[f.stato] ?? f.stato}${f.riaperture ? ` · riaperto ${f.riaperture}×` : ""} · ${data(f.created_at)}`,
    `  id: ${f.id}`,
    `  pagina: ${f.route}${f.area ? ` · area: ${f.area}` : ""}${collegamenti ? ` · ${collegamenti}` : ""}`,
    `  testo: ${f.testo.replace(/\n/g, "\n         ")}`,
  ].join("\n");
}

const [comando, ...argomenti] = process.argv.slice(2);

function opzione(nome) {
  const i = argomenti.indexOf(`--${nome}`);
  return i >= 0 ? argomenti[i + 1] : undefined;
}

if (comando === "elenco") {
  const righe = await lista(argomenti[0]);
  console.log(righe.length ? righe.map(riga).join("\n\n") : "Nessun feedback.");
  console.log(`\nTotale: ${righe.length}`);
} else if (comando === "json") {
  console.log(JSON.stringify(await lista(argomenti[0]), null, 2));
} else if (comando === "mostra") {
  const id = argomenti[0] ?? esci("Uso: mostra <id>");
  const { feedback: f, eventi } = await api("GET", `/api/feedback/agente?id=${encodeURIComponent(id)}`);
  console.log(riga(f));
  console.log(`  url reale: ${f.url ?? "-"}`);
  if (f.punto) console.log(`  punto: ${f.punto.ruolo} "${f.punto.etichetta}" · selettore: ${f.punto.selettore}`);
  if (f.entita) console.log(`  entità: ${f.entita}`);
  console.log(`  contesto: ${JSON.stringify(f.contesto)}`);
  console.log("\nStoria:");
  for (const e of eventi) {
    const cambio = e.stato_a ? ` → ${ETICHETTA[e.stato_a] ?? e.stato_a}` : "";
    console.log(`  ${data(e.created_at)} · ${e.autore} · ${e.tipo}${cambio}${e.testo ? `\n    ${e.testo.replace(/\n/g, "\n    ")}` : ""}`);
  }
} else if (comando === "stato") {
  const [id, stato] = argomenti;
  if (!id || !STATI.includes(stato)) esci("Uso: stato <id> <stato> [--issue N] [--pr N] [--testo \"...\"]");
  const body = { id, stato };
  if (opzione("issue")) body.issue_number = Number(opzione("issue"));
  if (opzione("pr")) body.pr_number = Number(opzione("pr"));
  if (opzione("testo")) body.testo = opzione("testo");
  console.log(JSON.stringify(await api("POST", "/api/feedback/agente", body)));
} else if (comando === "domanda") {
  const [id, testo] = argomenti;
  if (!id || !testo) esci('Uso: domanda <id> "domanda per Lorenzo"');
  console.log(JSON.stringify(await api("POST", "/api/feedback/agente", { id, stato: "serve-info", testo })));
} else {
  esci("Uso: node scripts/feedback.mjs elenco|json|mostra|stato|domanda (vedi l'intestazione del file)");
}
