import { test } from "node:test";
import assert from "node:assert/strict";
import { confrontaSerie, migliorSerie, superaRecord } from "./record.ts";

const s = (rip: number | null, peso: number | null = null, tempo: number | null = null) => ({
  rip_effettive: rip,
  peso_effettivo: peso,
  tempo_effettivo_sec: tempo,
});

test("senza storico non c'è record", () => {
  assert.equal(superaRecord("serie_rip_peso", s(8, 50), null), false);
});

test("con peso: peso maggiore è record, pari no", () => {
  assert.equal(superaRecord("serie_rip_peso", s(5, 55), s(8, 50)), true);
  assert.equal(superaRecord("serie_rip_peso", s(8, 50), s(8, 50)), false);
});

test("con peso uguale decidono le ripetizioni", () => {
  assert.equal(superaRecord("serie_rip_peso", s(9, 50), s(8, 50)), true);
  assert.equal(superaRecord("serie_rip_peso", s(7, 50), s(8, 50)), false);
});

test("a ripetizioni conta solo il numero di rip", () => {
  assert.equal(superaRecord("serie_rip", s(13), s(12)), true);
  assert.equal(superaRecord("serie_rip", s(12), s(12)), false);
});

test("a tempo conta la durata", () => {
  assert.equal(superaRecord("tempo", s(null, null, 65), s(null, null, 60)), true);
  assert.equal(superaRecord("tempo", s(null, null, 60), s(null, null, 60)), false);
});

test("storico senza valori utili non genera record", () => {
  assert.equal(superaRecord("serie_rip", s(5), s(null)), false);
});

test("migliorSerie sceglie la più alta e null se vuoto", () => {
  assert.equal(migliorSerie("serie_rip", []), null);
  const best = migliorSerie("serie_rip_peso", [s(8, 40), s(5, 50), s(10, 45)]);
  assert.equal(best?.peso_effettivo, 50);
  assert.equal(confrontaSerie("serie_rip", s(3), s(5)) < 0, true);
});
