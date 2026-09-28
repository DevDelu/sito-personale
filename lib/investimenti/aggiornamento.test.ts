import { test } from "node:test";
import assert from "node:assert/strict";
import { INTERVALLO_AGGIORNAMENTO_MS, prezziDaAggiornare } from "./aggiornamento.ts";

const adesso = Date.parse("2026-09-28T10:00:00Z");

// Feedback 27/09: i prezzi restavano fermi perché si aggiornavano solo col
// cron giornaliero. Ora la pagina li rinfresca da sola quando sono vecchi.
test("mai aggiornati: si aggiorna", () => {
  assert.equal(prezziDaAggiornare(null, adesso), true);
});

test("aggiornati da poco: niente richiesta", () => {
  assert.equal(prezziDaAggiornare(adesso - 60_000, adesso), false);
});

test("oltre l'intervallo: si aggiorna", () => {
  assert.equal(prezziDaAggiornare(adesso - INTERVALLO_AGGIORNAMENTO_MS, adesso), true);
});

test("timestamp nel futuro o non valido: si aggiorna", () => {
  assert.equal(prezziDaAggiornare(adesso + 60_000, adesso), true);
  assert.equal(prezziDaAggiornare(Number.NaN, adesso), true);
});
