import { test } from "node:test";
import assert from "node:assert/strict";
import { fase, scheda } from "./fasi.ts";
import { FEEDBACK_STATI } from "./types.ts";

const f = (stato: (typeof FEEDBACK_STATI)[number], pr_number: number | null = null) => ({ stato, pr_number, riaperture: 0 });

test("ogni stato ha una fase con una frase su cosa succede adesso", () => {
  for (const s of FEEDBACK_STATI) {
    const x = fase(f(s));
    assert.ok(x.etichetta && x.adesso, s);
  }
});

test("in lavorazione con PR aperta è da approvare e tocca a Lorenzo", () => {
  assert.equal(fase(f("in-lavorazione", 70)).etichetta, "Da approvare");
  assert.equal(scheda(f("in-lavorazione", 70)), "per-te");
  assert.equal(scheda(f("in-lavorazione")), "in-corso");
});

test("per te: domanda, approvazione e verifica; il resto è in corso o chiuso", () => {
  assert.equal(scheda(f("serve-info")), "per-te");
  assert.equal(scheda(f("da-verificare")), "per-te");
  assert.equal(scheda(f("nuovo")), "in-corso");
  assert.equal(scheda(f("riaperto")), "in-corso");
  assert.equal(scheda(f("verificato")), "chiusi");
  assert.equal(scheda(f("scartato")), "chiusi");
});
