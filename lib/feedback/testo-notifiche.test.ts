import { test } from "node:test";
import assert from "node:assert/strict";
import { notificaPerCambio } from "./testo-notifiche.ts";

test("domanda di un agente: notifica, al plurale se sono più d'una", () => {
  assert.equal(notificaPerCambio("serve-info", "agente", 1)?.title, "Un agente ha una domanda per te");
  assert.equal(notificaPerCambio("serve-info", "agente", 3)?.title, "3 domande degli agenti per te");
});

test("da verificare dopo il deploy (sistema): notifica con tag unico", () => {
  const n = notificaPerCambio("da-verificare", "sistema", 2);
  assert.equal(n?.title, "2 modifiche da verificare");
  assert.equal(n?.tag, "feedback-verifiche");
  assert.equal(n?.url, "/feedback");
});

test("niente notifica per le azioni di Lorenzo o per gli altri stati", () => {
  assert.equal(notificaPerCambio("serve-info", "lorenzo", 1), null);
  assert.equal(notificaPerCambio("in-lavorazione", "agente", 1), null);
  assert.equal(notificaPerCambio("preso-in-carico", "agente", 1), null);
  assert.equal(notificaPerCambio("da-verificare", "sistema", 0), null);
});
