import { test } from "node:test";
import assert from "node:assert/strict";
import { novitaDaPr, pulisciTitolo, testoNotifica } from "./testo-pr.ts";

test("pulisciTitolo: niente numero PR né prefissi tecnici", () => {
  assert.equal(pulisciTitolo("feat(spese): totale della settimana (#391)"), "Totale della settimana");
  assert.equal(pulisciTitolo("Esci funziona anche per il tester (#383)"), "Esci funziona anche per il tester");
});

test("sezione ## Novità: tipo, titolo e spiegazione scelti dall'autore", () => {
  const n = novitaDaPr({
    number: 1,
    title: "feat: weekly total",
    body: "## Cosa fa\nroba tecnica\n\n## Novità\nTipo: funzione\nTitolo: Totale della settimana\nIn **Spese** adesso vedi quanto hai speso questa settimana.\n\n## Verifiche\n- test",
    labels: [],
  });
  assert.deepEqual(n, {
    tipo: "funzione",
    titolo: "Totale della settimana",
    spiegazione: "In Spese adesso vedi quanto hai speso questa settimana.",
  });
});

test("sezione senza tipo: lo deducono le etichette", () => {
  const n = novitaDaPr({ number: 2, title: "Fix grafico", body: "## Novità\nIl grafico non si taglia più.", labels: ["bug"] });
  assert.equal(n.tipo, "correzione");
  assert.equal(n.titolo, "Fix grafico");
});

test("senza sezione: riga 'Nota per Lorenzo' delle PR dei feedback", () => {
  const n = novitaDaPr({ number: 3, title: "Pulsante più grande (#5)", body: "Feedback-id: x\nNota per Lorenzo: ora il pulsante si tocca meglio.", labels: [] });
  assert.deepEqual(n, { tipo: "correzione", titolo: "Pulsante più grande", spiegazione: "ora il pulsante si tocca meglio." });
});

test("senza niente: lavoro tecnico spiegato col titolo", () => {
  const n = novitaDaPr({ number: 4, title: "chore: aggiorna dipendenze", body: null });
  assert.deepEqual(n, { tipo: "tecnico", titolo: "Aggiorna dipendenze", spiegazione: "Aggiorna dipendenze" });
});

test("rollback: tipo annullata con spiegazione di default", () => {
  const n = novitaDaPr({ number: 5, title: 'Revert "Totale della settimana (#391)"', body: "" });
  assert.equal(n.tipo, "annullata");
  assert.equal(n.titolo, "Annullata: Totale della settimana");
  assert.match(n.spiegazione, /tornato com'era/);
});

test("notifica: solo per novità che cambiano qualcosa per te", () => {
  assert.equal(testoNotifica([{ tipo: "tecnico", titolo: "Dipendenze" }]), null);
  assert.deepEqual(testoNotifica([{ tipo: "funzione", titolo: "A" }, { tipo: "tecnico", titolo: "T" }]), {
    title: "Novità su Radar",
    body: "A",
  });
  assert.deepEqual(
    testoNotifica([
      { tipo: "funzione", titolo: "A" },
      { tipo: "correzione", titolo: "B" },
      { tipo: "annullata", titolo: "C" },
      { tipo: "funzione", titolo: "D" },
    ]),
    { title: "4 novità su Radar", body: "A · B e altre 2" }
  );
});
