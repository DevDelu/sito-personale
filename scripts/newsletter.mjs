#!/usr/bin/env node
// Newsletter degli agenti a Lorenzo, via Resend (stesso provider del sito).
//
//   node scripts/newsletter.mjs --oggetto "..." --html corpo.html [immagine.jpg ...]
//
// Le immagini sono allegate e mostrabili dentro l'HTML con <img src="cid:<nome-file>">.
// Spedire così, invece che passando le immagini al modello, non consuma quota
// Claude. Variabili: RESEND_API_KEY, RESEND_FROM_EMAIL; destinatario
// NEWSLETTER_TO, altrimenti AGENDA_ALERT_EMAIL. Non stampa mai i valori.
import { readFileSync } from "node:fs";
import { basename } from "node:path";

const argv = process.argv.slice(2);
let oggetto = null;
let html = null;
const immagini = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--oggetto") oggetto = argv[++i];
  else if (argv[i] === "--html") html = readFileSync(argv[++i], "utf8");
  else immagini.push(argv[i]);
}

const { RESEND_API_KEY, RESEND_FROM_EMAIL } = process.env;
const destinatario = process.env.NEWSLETTER_TO || process.env.AGENDA_ALERT_EMAIL;
const mancanti = [
  !RESEND_API_KEY && "RESEND_API_KEY",
  !RESEND_FROM_EMAIL && "RESEND_FROM_EMAIL",
  !destinatario && "NEWSLETTER_TO (o AGENDA_ALERT_EMAIL)",
].filter(Boolean);
if (mancanti.length) {
  console.error(`Newsletter non inviata, mancano: ${mancanti.join(", ")}`);
  process.exit(3);
}
if (!oggetto || !html) {
  console.error('Uso: node scripts/newsletter.mjs --oggetto "..." --html corpo.html [immagini...]');
  process.exit(2);
}

const allegati = immagini.map((file) => ({
  filename: basename(file),
  content: readFileSync(file).toString("base64"),
  content_id: basename(file),
}));
const peso = allegati.reduce((s, a) => s + a.content.length, 0);
if (peso > 30_000_000) {
  console.error("Allegati oltre ~22MB: riduci il numero di immagini.");
  process.exit(2);
}

const risposta = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ from: RESEND_FROM_EMAIL, to: [destinatario], subject: oggetto, html, attachments: allegati }),
});
if (!risposta.ok) {
  console.error(`Resend ${risposta.status}: ${(await risposta.text()).slice(0, 300)}`);
  process.exit(1);
}
console.log(`Newsletter inviata (${allegati.length} immagini).`);
