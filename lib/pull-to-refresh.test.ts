import { test } from "node:test";
import assert from "node:assert/strict";
import { distanzaTirata, puoIniziarePull, superaSoglia, PULL_MAX_PX, type ContestoPull } from "./pull-to-refresh.ts";

const OK: ContestoPull = {
  scrollY: 0,
  touchMultipli: false,
  schermoStretto: true,
  dialogoAperto: false,
  percorso: "/spese",
  campoConFocus: false,
  bersaglioEscluso: false,
};

test("la distanza ha resistenza, non è mai negativa e ha un tetto", () => {
  assert.equal(distanzaTirata(-20), 0);
  assert.equal(distanzaTirata(100), 50);
  assert.equal(distanzaTirata(1000), PULL_MAX_PX);
});

test("la soglia scatta oltre i 70px di indicatore", () => {
  assert.equal(superaSoglia(distanzaTirata(100)), false); // 50px
  assert.equal(superaSoglia(distanzaTirata(140)), true); // 70px
});

test("parte solo a scroll in cima, su schermo stretto, senza dialoghi", () => {
  assert.equal(puoIniziarePull(OK), true);
  assert.equal(puoIniziarePull({ ...OK, scrollY: 1 }), false);
  assert.equal(puoIniziarePull({ ...OK, touchMultipli: true }), false);
  assert.equal(puoIniziarePull({ ...OK, schermoStretto: false }), false);
  assert.equal(puoIniziarePull({ ...OK, dialogoAperto: true }), false);
  assert.equal(puoIniziarePull({ ...OK, campoConFocus: true }), false);
  assert.equal(puoIniziarePull({ ...OK, bersaglioEscluso: true }), false);
});

test("mai durante una sessione di allenamento", () => {
  assert.equal(puoIniziarePull({ ...OK, percorso: "/allenamenti/sessione/abc" }), false);
  assert.equal(puoIniziarePull({ ...OK, percorso: "/allenamenti" }), true);
});
