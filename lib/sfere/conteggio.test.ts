import { test } from "node:test";
import assert from "node:assert/strict";
import { completo, leggiSfere, raccogli } from "./conteggio.ts";

test("leggiSfere: input vuoto o rovinato dà lista vuota", () => {
  assert.deepEqual(leggiSfere(null), []);
  assert.deepEqual(leggiSfere(""), []);
  assert.deepEqual(leggiSfere("{non json"), []);
  assert.deepEqual(leggiSfere('{"a":1}'), []);
});

test("leggiSfere: scarta valori non validi e doppioni, ordina", () => {
  assert.deepEqual(leggiSfere("[3,1,3,0,8,2.5,\"x\"]"), [1, 3]);
});

test("raccogli: aggiunge, è idempotente e ignora numeri fuori range", () => {
  assert.deepEqual(raccogli([], 4), [4]);
  assert.deepEqual(raccogli([4], 2), [2, 4]);
  assert.deepEqual(raccogli([2, 4], 4), [2, 4]);
  assert.deepEqual(raccogli([2], 0), [2]);
  assert.deepEqual(raccogli([2], 8), [2]);
});

test("completo: solo con tutte e sette", () => {
  assert.equal(completo([1, 2, 3, 4, 5, 6]), false);
  assert.equal(completo([1, 2, 3, 4, 5, 6, 7]), true);
});
