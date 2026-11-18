import { test } from "node:test";
import assert from "node:assert/strict";
import { datiBottone, leggiBottone, segretoValido, utenteAutorizzato } from "./auth.ts";

const ID = "3f2b8c1e-9a4d-4e2b-8f1a-1c2d3e4f5a6b";

test("segreto: fail-closed se manca in env o nell'header", () => {
  assert.equal(segretoValido("abc", undefined), false);
  assert.equal(segretoValido("abc", ""), false);
  assert.equal(segretoValido(null, "abc"), false);
  assert.equal(segretoValido("abd", "abc"), false);
  assert.equal(segretoValido("abcd", "abc"), false);
  assert.equal(segretoValido("abc", "abc"), true);
});

test("utente: solo il chat id configurato", () => {
  assert.equal(utenteAutorizzato(123, undefined), false);
  assert.equal(utenteAutorizzato(undefined, "123"), false);
  assert.equal(utenteAutorizzato(124, "123"), false);
  assert.equal(utenteAutorizzato(123, " 123 "), true);
});

test("bottoni: andata e ritorno, entro i 64 byte di Telegram", () => {
  assert.deepEqual(leggiBottone(datiBottone("conferma", ID)), { azione: "conferma", bozzaId: ID });
  assert.deepEqual(leggiBottone(datiBottone("annulla", ID)), { azione: "annulla", bozzaId: ID });
  assert.ok(Buffer.byteLength(datiBottone("conferma", ID)) <= 64);
});

test("bottoni: dati estranei rifiutati", () => {
  assert.equal(leggiBottone(undefined), null);
  assert.equal(leggiBottone("ok:non-un-uuid"), null);
  assert.equal(leggiBottone(`xx:${ID}`), null);
  assert.equal(leggiBottone("ok"), null);
});
