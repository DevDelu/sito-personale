import { test } from "node:test";
import assert from "node:assert/strict";
import { filtraPerIntervallo } from "./intervalli.ts";

const punti = Array.from({ length: 60 }, (_, i) => ({
  data: new Date(Date.UTC(2026, 7, 1 + i)).toISOString().slice(0, 10),
}));

test("tutto: nessun filtro", () => {
  assert.equal(filtraPerIntervallo(punti, "tutto").length, 60);
});

test("1 settimana: ultimi 7 giorni più il giorno di soglia", () => {
  const r = filtraPerIntervallo(punti, "1s");
  assert.equal(r.length, 8);
  assert.equal(r[r.length - 1].data, punti[59].data);
});

test("1 mese parte da 30 giorni prima dell'ultimo punto", () => {
  const r = filtraPerIntervallo(punti, "1m");
  assert.equal(r[0].data, punti[29].data);
});

test("storico vuoto o più corto dell'intervallo: restituisce quello che c'è", () => {
  assert.deepEqual(filtraPerIntervallo([], "1m"), []);
  assert.equal(filtraPerIntervallo(punti.slice(0, 3), "1a").length, 3);
});
