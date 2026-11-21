import test from "node:test";
import assert from "node:assert/strict";
import {
  caricamentoInRitardo,
  etichettaUltimoCaricamento,
  giorniDalCaricamento,
  serveIlPromemoria,
} from "./ultimo-import.ts";

const adesso = new Date("2026-11-22T16:00:00Z"); // domenica pomeriggio a Roma

test("giorni di calendario in fuso Europe/Rome", () => {
  assert.equal(giorniDalCaricamento("2026-11-22T10:00:00Z", adesso), 0);
  assert.equal(giorniDalCaricamento("2026-11-21T23:30:00Z", adesso), 0); // già 22/11 a Roma
  assert.equal(giorniDalCaricamento("2026-11-21T10:00:00Z", adesso), 1);
  assert.equal(giorniDalCaricamento("2026-11-12T10:00:00Z", adesso), 10);
});

test("etichette", () => {
  assert.equal(etichettaUltimoCaricamento(0), "Ultimo caricamento: oggi");
  assert.equal(etichettaUltimoCaricamento(1), "Ultimo caricamento: ieri");
  assert.equal(etichettaUltimoCaricamento(4), "Ultimo caricamento: 4 giorni fa");
});

test("soglia avviso a 10 giorni", () => {
  assert.equal(caricamentoInRitardo(9), false);
  assert.equal(caricamentoInRitardo(10), true);
});

test("promemoria: parte senza import o con import vecchio", () => {
  assert.equal(serveIlPromemoria(null, adesso), true);
  assert.equal(serveIlPromemoria("2026-11-21T10:00:00Z", adesso), false); // ieri
  assert.equal(serveIlPromemoria("2026-11-19T10:00:00Z", adesso), false); // 3 giorni
  assert.equal(serveIlPromemoria("2026-11-18T10:00:00Z", adesso), true); // 4 giorni
});
