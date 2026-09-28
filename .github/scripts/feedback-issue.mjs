// Corpo e titolo delle issue `dal-lorenzo` e dei commenti di
// aggiornamento, separati da feedback-notte.mjs per poterli testare
// (feedback-issue.test.mjs): il repo è PUBBLICO.
//
// Nella issue vanno SOLO: route template, etichetta dell'area, ruolo ed
// etichetta (senza cifre né valute) dell'elemento indicato, TIPO di entità,
// testo parafrasato. Restano in Supabase: url completo, id dell'entità,
// testo originale, note e risposte originali.

import { etichettaArea } from "../../lib/feedback/aree.ts";
import { motiviNonPubblicabile } from "./privacy.mjs";

export const MARCATORE = (id) => `<!-- feedback-id: ${id} -->`;

const TIPO = { problema: "Problema", complicato: "Complicato", idea: "Idea" };

// Etichette brevi dell'interfaccia (già senza cifre lato client): di nuovo
// senza cifre, valute e caratteri markdown, perché arrivano dal browser.
export function etichettaPubblica(testo) {
  return String(testo ?? "")
    .replace(/\d/g, "#")
    .replace(/[€$£`*_[\]<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

// Solo `route` template: mai `url` (query con valori, id nel path).
function routePubblica(route) {
  return /^\/[\w/[\]-]*$/.test(route ?? "") ? route : "(pagina non riconosciuta)";
}

function tipoEntita(entita) {
  const m = /^([a-z][a-z-]{0,39}):/.exec(entita ?? "");
  return m ? m[1] : null;
}

export function contestoTecnico(f) {
  const c = f.contesto ?? {};
  const righe = [
    `- **Pagina**: \`${routePubblica(f.route)}\` · **Origine**: ${f.origine} · **Viewport**: ${c.viewport ?? "?"} · **Tema**: ${c.tema ?? "?"}`,
  ];
  const area = etichettaArea(f.area);
  if (area) righe.push(`- **Area**: ${area} (\`${f.area}\`)`);
  if (f.punto) {
    const etichetta = etichettaPubblica(f.punto.etichetta);
    righe.push(`- **Elemento indicato**: ${etichettaPubblica(f.punto.ruolo)}${etichetta ? ` "${etichetta}"` : ""}`);
  }
  const entita = tipoEntita(f.entita);
  if (entita) righe.push(`- **Dato coinvolto**: un record di tipo \`${entita}\` (id in Supabase)`);
  if (typeof c.scroll_y === "number") righe.push(`- **Scroll**: ${Math.round(c.scroll_y)}% della pagina`);
  if (c.versione) righe.push(`- **Versione**: \`${String(c.versione).slice(0, 7)}\``);
  if (c.query_chiavi?.length) {
    righe.push(`- **Filtri attivi (solo chiavi)**: ${c.query_chiavi.map((k) => `\`${etichettaPubblica(k)}\``).join(", ")}`);
  }
  // Degli attriti si pubblicano solo tipo e, per errore_api, metodo + route
  // template + status (già senza id): i messaggi di errore JS possono
  // contenere dati, restano in Supabase.
  const attriti = [c.attrito, ...(c.attriti_recenti ?? [])].filter(Boolean);
  const visti = new Set();
  for (const a of attriti) {
    const riga =
      a.tipo === "errore_api" && /^[A-Z]+ \/[\w/[\]-]* \d{3}$/.test(a.dettaglio ?? "")
        ? `\`${a.tipo}\` ${a.dettaglio}`
        : `\`${a.tipo}\` su \`${routePubblica(a.pagina)}\``;
    visti.add(riga);
  }
  if (visti.size) righe.push(`- **Attriti recenti**: ${[...visti].slice(0, 5).join("; ")}`);
  return righe.join("\n");
}

// La proposta di Claude passa solo se il controllo privacy non trova nulla.
export function propostaPubblicabile(f, p) {
  if (!p || typeof p.titolo !== "string" || typeof p.descrizione !== "string") return { proposta: null, motivi: [] };
  const pubblico = [p.titolo, p.descrizione, p.dove_guardare ?? ""].join("\n");
  const motivi = motiviNonPubblicabile(pubblico, f.testo);
  return { proposta: motivi.length === 0 ? p : null, motivi };
}

export function corpoIssue(f, proposta) {
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
  parti.push(
    "",
    "### Contesto tecnico",
    contestoTecnico(f),
    "",
    "_Per riprodurre: `route`, `area`, `punto` ed `entita` completi sono leggibili dal tester in sola lettura._",
    "",
    `_Feedback id: \`${f.id}\`_`,
    MARCATORE(f.id)
  );
  return parti.join("\n");
}

export function titoloIssue(f, proposta) {
  const area = etichettaArea(f.area);
  const base = proposta?.titolo?.trim() || `${TIPO[f.tipo] ?? "Feedback"} su ${area ?? routePubblica(f.route)}`;
  return base.replace(/\s+/g, " ").slice(0, 90);
}

const COSA = { nota: "una nota", risposta: "una risposta alla domanda" };

// Commento con la nota/risposta di Lorenzo: parafrasi se passa il controllo
// privacy, altrimenti un rimando generico a Supabase.
export function commentoEvento(e, parafrasi) {
  const ok = typeof parafrasi === "string" && parafrasi.trim() && motiviNonPubblicabile(parafrasi, e.testo).length === 0;
  const intestazione = `**Lorenzo ha aggiunto ${COSA[e.tipo] ?? "una nota"}**`;
  return ok
    ? `${intestazione} (parafrasata):\n\n${parafrasi.trim()}`
    : `${intestazione}. _Testo non pubblicabile automaticamente: è su Supabase (\`feedback_eventi\`, id \`${e.id}\`)._`;
}

export function commentoRiapertura(f) {
  const volte = f.riaperture ?? 1;
  const righe = [
    `**Lorenzo ha verificato in produzione: non è sistemato** (riapertura n. ${volte}).`,
    "",
    "Il feedback torna in coda con priorità massima (etichetta `riaperto`).",
  ];
  if (volte >= 2) {
    righe.push(
      "",
      "⚠️ Riaperto almeno 2 volte (`ostinato`): non ritentare alla cieca. Serve una domanda a Lorenzo (`serve-info`) o una proposta diversa."
    );
  }
  return righe.join("\n");
}

export function etichetteRiapertura(f) {
  return (f.riaperture ?? 1) >= 2 ? ["riaperto", "ostinato"] : ["riaperto"];
}
