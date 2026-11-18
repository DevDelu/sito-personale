#!/usr/bin/env node
// Resoconto di fine turno degli agenti, dentro Radar (sezione Novità →
// Resoconti) con una notifica sul telefono di Lorenzo. Sostituisce la
// newsletter via email, che resta solo come riserva.
//
//   node scripts/resoconto.mjs --turno "principale" --titolo "..." \
//     --file resoconto.md [--azioni 2] [--anteprima "2 PR da approvare"] [immagini...]
//
// Il file è Markdown semplice (titoli, elenchi, **grassetto**, link): niente
// HTML, che la pagina non interpreta. Variabili: RADAR_URL e
// FEEDBACK_AGENTE_SECRET (le stesse di scripts/feedback.mjs).
//
// Se Radar non è raggiungibile o la notifica non parte (push non attive sul
// telefono), il resoconto viene spedito per email con scripts/newsletter.mjs
// (immagini comprese, se passate): così arriva comunque. Non stampa mai i
// valori delle variabili né il testo del resoconto.
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const opz = { turno: null, titolo: null, file: null, azioni: 0, anteprima: "" };
const immagini = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--turno") opz.turno = argv[++i];
  else if (a === "--titolo") opz.titolo = argv[++i];
  else if (a === "--file") opz.file = argv[++i];
  else if (a === "--azioni") opz.azioni = Number.parseInt(argv[++i], 10) || 0;
  else if (a === "--anteprima") opz.anteprima = argv[++i];
  else immagini.push(a);
}
if (!opz.turno || !opz.titolo || !opz.file) {
  console.error('Uso: node scripts/resoconto.mjs --turno "..." --titolo "..." --file resoconto.md [--azioni N] [--anteprima "..."] [immagini...]');
  process.exit(2);
}
const testo = readFileSync(opz.file, "utf8");

async function inviaARadar() {
  const { RADAR_URL } = process.env;
  const secret = process.env.FEEDBACK_AGENTE_SECRET || process.env.FEEDBACK_AGENT_SECRET;
  if (!RADAR_URL || !secret) return { ok: false, motivo: "RADAR_URL o FEEDBACK_AGENTE_SECRET mancanti" };
  try {
    const res = await fetch(`${RADAR_URL.replace(/\/$/, "")}/api/resoconti/agente`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        turno: opz.turno,
        titolo: opz.titolo,
        testo,
        azioni_per_te: opz.azioni,
        anteprima: opz.anteprima,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, motivo: `Radar ha risposto ${res.status}` };
    return { ok: true, notificato: !!json.notificato, motivo: json.motivo ?? null };
  } catch (e) {
    return { ok: false, motivo: `Radar non raggiungibile (${e.code ?? e.name})` };
  }
}

// Markdown → HTML minimale per l'email di riserva (testo già scritto dagli
// agenti; si fa l'escape di tutto e si ricostruiscono solo titoli,
// elenchi, grassetto e link).
function htmlDaMarkdown(md) {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s) =>
    esc(s)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
  const out = [];
  let lista = false;
  for (const riga of md.split(/\r?\n/).map((r) => r.trim())) {
    const voce = riga.match(/^([-*•]|\d+[.)])\s+(.+)$/);
    if (!voce && lista) {
      out.push("</ul>");
      lista = false;
    }
    if (!riga) continue;
    const titolo = riga.match(/^(#{1,3})\s+(.+)$/);
    if (titolo) out.push(`<h${titolo[1].length + 1}>${inline(titolo[2])}</h${titolo[1].length + 1}>`);
    else if (voce) {
      if (!lista) out.push("<ul>");
      lista = true;
      out.push(`<li>${inline(voce[2])}</li>`);
    } else out.push(`<p>${inline(riga)}</p>`);
  }
  if (lista) out.push("</ul>");
  return out.join("\n");
}

function inviaEmail(motivo) {
  const dir = mkdtempSync(join(tmpdir(), "resoconto-"));
  const html = join(dir, "resoconto.html");
  writeFileSync(html, `<p><em>Arrivato per email perché ${motivo}.</em></p>\n${htmlDaMarkdown(testo)}`);
  const newsletter = fileURLToPath(new URL("./newsletter.mjs", import.meta.url));
  const r = spawnSync(process.execPath, [newsletter, "--oggetto", opz.titolo, "--html", html, ...immagini], {
    stdio: "inherit",
  });
  return r.status === 0;
}

const esito = await inviaARadar();
if (esito.ok && esito.notificato) {
  console.log("Resoconto pubblicato in Radar e notificato.");
  process.exit(0);
}
const motivo = esito.ok ? `la notifica non è partita (${esito.motivo ?? "motivo sconosciuto"})` : esito.motivo;
console.log(esito.ok ? `Resoconto pubblicato in Radar, ma ${motivo}: invio anche l'email di riserva.` : `${motivo}: invio il resoconto per email.`);
process.exit(inviaEmail(esito.ok ? "le notifiche dell'app non sono attive" : "Radar non era raggiungibile") ? 0 : 1);
