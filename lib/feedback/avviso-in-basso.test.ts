import { test } from "node:test";
import assert from "node:assert/strict";
import { creaSegnale } from "./avviso-in-basso.ts";

test("segnale: avvisa solo quando cambia e smette dopo la disiscrizione", () => {
  const segnale = creaSegnale();
  let volte = 0;
  const smetti = segnale.ascolta(() => volte++);
  assert.equal(segnale.leggi(), false);
  segnale.imposta(true);
  segnale.imposta(true);
  assert.equal(segnale.leggi(), true);
  assert.equal(volte, 1);
  smetti();
  segnale.imposta(false);
  assert.equal(segnale.leggi(), false);
  assert.equal(volte, 1);
});
