import { test } from "node:test";
import assert from "node:assert/strict";
import { verificaTransizione } from "./stati.ts";

test("flusso felice", () => {
  assert.deepEqual(verificaTransizione("nuovo", "preso-in-carico", "agente"), { ok: true });
  assert.deepEqual(verificaTransizione("preso-in-carico", "in-lavorazione", "agente"), { ok: true });
  assert.deepEqual(verificaTransizione("in-lavorazione", "da-verificare", "sistema"), { ok: true });
  assert.deepEqual(verificaTransizione("da-verificare", "verificato", "lorenzo"), { ok: true });
});

test("gli agenti non possono mai impostare verificato o scartato (403)", () => {
  for (const da of ["da-verificare", "in-lavorazione", "nuovo"] as const) {
    for (const a of ["verificato", "scartato"] as const) {
      const esito = verificaTransizione(da, a, "agente");
      assert.equal(esito.ok, false);
      assert.equal(!esito.ok && esito.motivo, "vietato");
    }
  }
});

test("da-verificare solo dal sistema (dopo il deploy), mai dall'agente al merge", () => {
  assert.equal(verificaTransizione("in-lavorazione", "da-verificare", "agente").ok, false);
  assert.equal(verificaTransizione("preso-in-carico", "da-verificare", "sistema").ok, false);
});

test("riapertura e ritorno in coda", () => {
  assert.deepEqual(verificaTransizione("da-verificare", "riaperto", "lorenzo"), { ok: true });
  assert.deepEqual(verificaTransizione("riaperto", "preso-in-carico", "agente"), { ok: true });
  assert.equal(verificaTransizione("verificato", "riaperto", "lorenzo").ok, false);
});

test("serve-info: domanda dell'agente, risposta di Lorenzo", () => {
  assert.deepEqual(verificaTransizione("preso-in-carico", "serve-info", "agente"), { ok: true });
  assert.deepEqual(verificaTransizione("in-lavorazione", "serve-info", "agente"), { ok: true });
  assert.deepEqual(verificaTransizione("serve-info", "preso-in-carico", "lorenzo"), { ok: true });
  assert.equal(verificaTransizione("nuovo", "serve-info", "agente").ok, false);
});

test("scartare: solo Lorenzo e solo da uno stato non chiuso", () => {
  assert.deepEqual(verificaTransizione("nuovo", "scartato", "lorenzo"), { ok: true });
  assert.deepEqual(verificaTransizione("da-verificare", "scartato", "lorenzo"), { ok: true });
  assert.equal(verificaTransizione("verificato", "scartato", "lorenzo").ok, false);
  assert.equal(verificaTransizione("scartato", "scartato", "lorenzo").ok, false);
});
