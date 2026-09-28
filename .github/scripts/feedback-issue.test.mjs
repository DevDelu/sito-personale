// Il repo è PUBBLICO: nessuna issue deve contenere id di entità, URL
// completi, importi o il testo originale di Lorenzo (npm test).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  commentoEvento,
  commentoRiapertura,
  contestoTecnico,
  corpoIssue,
  etichettaPubblica,
  etichetteRiapertura,
  propostaPubblicabile,
  titoloIssue,
} from "./feedback-issue.mjs";

const ID_ENTITA = "9b1c2d3e-aaaa-bbbb-cccc-1234567890ab";

const feedback = {
  id: "11111111-2222-3333-4444-555555555555",
  tipo: "problema",
  testo: "Ho speso 34,90 € da Esselunga il 12/09 e la riga non si modifica più",
  origine: "tab",
  route: "/spese/gestione",
  url: "/spese/gestione?q=esselunga&min=34.90&pagina=3",
  area: "spese.modifica-movimento",
  entita: `transazione:${ID_ENTITA}`,
  punto: {
    ruolo: "bottone",
    // Arriva dal browser: il client toglie le cifre, ma non ci si fida.
    etichetta: "Salva 34,90 €",
    selettore: `[data-fb-area="spese.gestione.tabella"] [data-fb-entita="transazione:${ID_ENTITA}"] > button`,
    posizione: { x: 50, y: 40 },
  },
  contesto: {
    query_chiavi: ["q", "min"],
    viewport: "mobile",
    tema: "scuro",
    scroll_y: 42,
    versione: "abcdef1234567",
    attrito: { tipo: "errore_js", pagina: "/spese/gestione", at: "", dettaglio: "Cannot read 34.90 of Esselunga" },
  },
};

function assertNienteDatiPrivati(testo) {
  assert.ok(!testo.includes(ID_ENTITA), "id dell'entità");
  assert.ok(!testo.includes("?q="), "URL completo con query");
  assert.ok(!testo.includes("esselunga") && !testo.includes("Esselunga"), "testo/dati originali");
  assert.doesNotMatch(testo, /\d+[.,]\d{2}\b/, "importo");
  assert.doesNotMatch(testo, /[€$£]/, "valuta");
  assert.doesNotMatch(testo, /data-fb-entita/, "selettore con id");
}

test("corpo della issue senza parafrasi: niente id entità, URL, importi", () => {
  const corpo = corpoIssue(feedback, null);
  assertNienteDatiPrivati(corpo);
  assert.match(corpo, /`\/spese\/gestione`/);
  assert.match(corpo, /Spese › Modifica movimento/);
  assert.match(corpo, /bottone "Salva ##,##"/);
  assert.match(corpo, /tipo `transazione`/);
});

test("titolo generico: area leggibile, nessun dato", () => {
  const titolo = titoloIssue(feedback, null);
  assert.equal(titolo, "Problema su Spese › Modifica movimento");
  assertNienteDatiPrivati(titolo);
});

test("una parafrasi con importi o frasi copiate viene scartata", () => {
  const cattiva = { titolo: "Riga non modificabile", descrizione: "Una spesa da 34,90 € non si modifica." };
  assert.equal(propostaPubblicabile(feedback, cattiva).proposta, null);
  const copiata = { titolo: "x", descrizione: "Lorenzo dice: da Esselunga il e la riga non si modifica più" };
  assert.equal(propostaPubblicabile(feedback, copiata).proposta, null);
  const buona = {
    titolo: "Il salvataggio di un movimento modificato non va a buon fine",
    descrizione: "Lorenzo segnala che dopo aver cambiato un movimento il pulsante di salvataggio non ha effetto.",
  };
  const { proposta } = propostaPubblicabile(feedback, buona);
  assert.ok(proposta);
  assertNienteDatiPrivati(corpoIssue(feedback, proposta));
});

test("route non template (con id o query) non finisce nella issue", () => {
  const c = contestoTecnico({ ...feedback, route: `/carte/${ID_ENTITA}?x=1` });
  assert.ok(!c.includes(ID_ENTITA));
});

test("etichetta pubblica: niente cifre, valute né markdown", () => {
  assert.equal(etichettaPubblica("Elimina `12,50 €` **ora**"), "Elimina ##,## ora");
});

test("commenti su note e riaperture", () => {
  const evento = { id: "e1", tipo: "risposta", testo: "Succede con la spesa da 34,90 € di Esselunga" };
  const scartata = commentoEvento(evento, "Succede con una spesa da 34,90 €");
  assertNienteDatiPrivati(scartata);
  assert.match(commentoEvento(evento, "Lorenzo precisa che capita con una spesa specifica."), /parafrasata/);

  assert.deepEqual(etichetteRiapertura({ riaperture: 1 }), ["riaperto"]);
  assert.deepEqual(etichetteRiapertura({ riaperture: 2 }), ["riaperto", "ostinato"]);
  assert.match(commentoRiapertura({ riaperture: 2 }), /ostinato/);
});
