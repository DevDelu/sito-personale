import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { leggiAPagine, RIGHE_PER_PAGINA } from "./pagine.ts";

// Come PostgREST: mai più di 1000 righe per richiesta.
function sorgente(totale: number) {
  const righe = Array.from({ length: totale }, (_, i) => i);
  return async (da: number, a: number) => ({
    data: righe.slice(da, Math.min(a + 1, da + RIGHE_PER_PAGINA)),
    error: null,
  });
}

for (const totale of [0, 999, 1000, 1001, 2500]) {
  test(`legge tutte le righe: ${totale}`, async () => {
    const righe = await leggiAPagine(sorgente(totale));
    assert.equal(righe.length, totale);
    assert.equal(new Set(righe).size, totale);
  });
}

test("un errore a una pagina successiva non restituisce dati parziali", async () => {
  const leggi = async (da: number) =>
    da === 0
      ? { data: Array.from({ length: RIGHE_PER_PAGINA }, () => 1), error: null }
      : { data: null, error: { message: "rete" } };
  await assert.rejects(leggiAPagine(leggi), /rete/);
});

test("la panoramica Spese legge spese ed entrate a pagine, con ordine univoco", () => {
  const sorgenteQuery = readFileSync(new URL("./queries.ts", import.meta.url), "utf8");
  const overview = sorgenteQuery.slice(
    sorgenteQuery.indexOf("function getOverviewData"),
    sorgenteQuery.indexOf("function getSpesePerRicorrenti")
  );
  assert.equal(overview.match(/leggiAPagine/g)?.length, 2);
  assert.equal(overview.match(/\.order\("id"/g)?.length, 2);
  assert.equal(overview.match(/\.range\(da, a\)/g)?.length, 2);
});
