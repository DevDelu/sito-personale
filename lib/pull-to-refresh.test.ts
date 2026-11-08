import { test } from "node:test";
import assert from "node:assert/strict";
import { distanzaVisibile, gestoAbilitato, superaSoglia } from "./pull-to-refresh.ts";

const base = { scrollY: 0, larghezza: 390, percorso: "/spese", dialogoAperto: false, campoConFocus: false };

test("distanza: zero se non si tira, limitata in alto", () => {
  assert.equal(distanzaVisibile(-20), 0);
  assert.equal(distanzaVisibile(NaN), 0);
  assert.equal(distanzaVisibile(100), 50);
  assert.equal(distanzaVisibile(1000), 110);
});

test("soglia: serve tirare abbastanza", () => {
  assert.equal(superaSoglia(20), false);
  assert.equal(superaSoglia(150), true);
});

test("gesto abilitato solo in cima, su telefono, senza dialoghi", () => {
  assert.equal(gestoAbilitato(base), true);
  assert.equal(gestoAbilitato({ ...base, scrollY: 12 }), false);
  assert.equal(gestoAbilitato({ ...base, larghezza: 1024 }), false);
  assert.equal(gestoAbilitato({ ...base, dialogoAperto: true }), false);
  assert.equal(gestoAbilitato({ ...base, campoConFocus: true }), false);
  assert.equal(gestoAbilitato({ ...base, percorso: "/allenamenti/sessione/abc" }), false);
});
