import { test } from "node:test";
import assert from "node:assert/strict";
import {
  adaptiveTickInterval,
  categorieOrdinatePerTotale,
  dailyFlow,
  formatFonte,
} from "./spese-utils.ts";

test("categorieOrdinatePerTotale somma per categoria e ordina per totale decrescente", () => {
  const out = categorieOrdinatePerTotale([
    { categoria_nome: "Cibo", categoria_colore: "var(--cat-cibo)", importo: 10 },
    { categoria_nome: "Casa", categoria_colore: "var(--cat-casa)", importo: 50 },
    { categoria_nome: "Cibo", categoria_colore: "var(--cat-cibo)", importo: 15.5 },
  ]);
  assert.deepEqual(out, [
    { nome: "Casa", colore: "var(--cat-casa)", totale: 50 },
    { nome: "Cibo", colore: "var(--cat-cibo)", totale: 25.5 },
  ]);
});

test("categorieOrdinatePerTotale raggruppa le righe senza categoria", () => {
  const out = categorieOrdinatePerTotale([
    { categoria_nome: null, categoria_colore: null, importo: 3 },
    { categoria_nome: null, categoria_colore: null, importo: 4 },
  ]);
  assert.deepEqual(out, [{ nome: "Senza categoria", colore: null, totale: 7 }]);
  assert.deepEqual(categorieOrdinatePerTotale([]), []);
});

test("formatFonte traduce le fonti note e lascia passare le altre", () => {
  assert.equal(formatFonte("intesa"), "Intesa Sanpaolo");
  assert.equal(formatFonte("crypto"), "Crypto.com");
  assert.equal(formatFonte("manuale"), "Manuale");
  assert.equal(formatFonte("altra"), "altra");
});

test("adaptiveTickInterval mostra tutto fino a maxTicks, poi dirada", () => {
  assert.equal(adaptiveTickInterval(0), 0);
  assert.equal(adaptiveTickInterval(8), 0);
  assert.equal(adaptiveTickInterval(9), 1);
  assert.equal(adaptiveTickInterval(30), 3);
  assert.equal(adaptiveTickInterval(30, 5), 5);
});

test("dailyFlow copre ogni giorno del periodo, estremi inclusi, con zeri dove non c'è nulla", () => {
  const out = dailyFlow(
    [
      { data: "2026-01-01", importo: 10 },
      { data: "2026-01-01", importo: 5 },
      { data: "2026-01-03", importo: 2 },
    ],
    [{ data: "2026-01-02", importo: 100 }],
    "2026-01-01",
    "2026-01-03"
  );
  assert.deepEqual(
    out.map((p) => [p.data, p.entrate, p.uscite]),
    [
      ["2026-01-01", 0, 15],
      ["2026-01-02", 100, 0],
      ["2026-01-03", 0, 2],
    ]
  );
});

test("dailyFlow attraversa il cambio di mese e anno senza saltare giorni", () => {
  const out = dailyFlow([], [], "2026-12-30", "2027-01-02");
  assert.deepEqual(out.map((p) => p.data), ["2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02"]);
});
