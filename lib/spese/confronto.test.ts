import { test } from "node:test";
import assert from "node:assert/strict";
import { periodoPrecedente, variazionePercentuale } from "./confronto.ts";

test("periodo precedente: stessa durata, giorno prima", () => {
  assert.deepEqual(periodoPrecedente("2026-11-01", "2026-11-08"), { from: "2026-10-24", to: "2026-10-31" });
  assert.deepEqual(periodoPrecedente("2026-03-01", "2026-03-01"), { from: "2026-02-28", to: "2026-02-28" });
});

test("periodo precedente: date non valide o invertite", () => {
  assert.equal(periodoPrecedente("boh", "2026-11-08"), null);
  assert.equal(periodoPrecedente("2026-11-08", "2026-11-01"), null);
});

test("variazione percentuale", () => {
  assert.equal(variazionePercentuale(112, 100), 12);
  assert.equal(variazionePercentuale(50, 100), -50);
  assert.equal(variazionePercentuale(100, 100), 0);
});

test("variazione: base zero o non finita non divide", () => {
  assert.equal(variazionePercentuale(10, 0), null);
  assert.equal(variazionePercentuale(NaN, 10), null);
});
