import { test } from "node:test";
import assert from "node:assert/strict";
import { dovrebbeRefresh, REFRESH_SOGLIA_MS, type ContestoRefresh } from "./app-refresh.ts";

const base: ContestoRefresh = {
  ora: 10 * REFRESH_SOGLIA_MS,
  nascostaDal: 10 * REFRESH_SOGLIA_MS - REFRESH_SOGLIA_MS - 1,
  ultimoRefresh: null,
  percorso: "/spese",
  campoConFocus: false,
  dialogoAperto: false,
};

test("dopo oltre 5 minuti in sfondo si aggiorna", () => {
  assert.equal(dovrebbeRefresh(base), true);
});

test("sfondo breve: niente refresh", () => {
  assert.equal(dovrebbeRefresh({ ...base, nascostaDal: base.ora - 1000 }), false);
});

test("mai andata in sfondo: niente refresh", () => {
  assert.equal(dovrebbeRefresh({ ...base, nascostaDal: null }), false);
});

test("massimo un refresh ogni 5 minuti", () => {
  assert.equal(dovrebbeRefresh({ ...base, ultimoRefresh: base.ora - 1000 }), false);
  assert.equal(dovrebbeRefresh({ ...base, ultimoRefresh: base.ora - REFRESH_SOGLIA_MS - 1 }), true);
});

test("sessione di allenamento, campo in focus o dialogo aperto: niente refresh", () => {
  assert.equal(dovrebbeRefresh({ ...base, percorso: "/allenamenti/sessione/abc" }), false);
  assert.equal(dovrebbeRefresh({ ...base, campoConFocus: true }), false);
  assert.equal(dovrebbeRefresh({ ...base, dialogoAperto: true }), false);
});
