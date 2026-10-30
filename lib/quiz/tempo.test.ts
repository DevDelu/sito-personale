import { test } from "node:test";
import assert from "node:assert/strict";
import { MS_MASSIMI, normalizzaTempo } from "./tempo.ts";

test("valori non numerici, NaN, Infinity e negativi salgono al minimo", () => {
  for (const v of [undefined, null, "12", NaN, Infinity, -5, 0]) {
    assert.equal(normalizzaTempo(v, 10), 4000);
  }
});

test("un tempo plausibile resta (arrotondato)", () => {
  assert.equal(normalizzaTempo(45_000.4, 10), 45_000);
});

test("un tempo enorme è limitato al massimo", () => {
  assert.equal(normalizzaTempo(1e15, 10), MS_MASSIMI);
});

test("senza domande conta almeno una domanda", () => {
  assert.equal(normalizzaTempo(0, 0), 400);
});
