import { test } from "node:test";
import assert from "node:assert/strict";
import { alimentiFrequenti } from "./frequenti.ts";
import type { TipoPasto } from "./types.ts";

function p(data: string, tipo: TipoPasto, id: string | null, nome: string, q: number, created = "10:00") {
  return {
    data,
    tipo_pasto: tipo,
    alimento_id: id,
    alimento_nome: nome,
    quantita_g: q,
    created_at: `${data}T${created}:00Z`,
  };
}

const OGGI = "2026-03-31";

test("ordina per numero di volte, poi per recenza", () => {
  const pasti = [
    p("2026-03-20", "colazione", "a", "Yogurt", 150),
    p("2026-03-21", "colazione", "a", "Yogurt", 125),
    p("2026-03-30", "colazione", "b", "Pane", 50),
    p("2026-03-25", "colazione", "c", "Miele", 10),
  ];
  const r = alimentiFrequenti(pasti, "colazione", OGGI);
  assert.deepEqual(r.map((x) => x.nome), ["Yogurt", "Pane", "Miele"]);
  assert.equal(r[0].volte, 2);
  assert.equal(r[0].ultimaQuantitaG, 125);
});

test("considera solo il tipo di pasto richiesto", () => {
  const pasti = [p("2026-03-30", "cena", "a", "Riso", 80), p("2026-03-30", "pranzo", "b", "Pasta", 90)];
  assert.deepEqual(alimentiFrequenti(pasti, "cena", OGGI).map((x) => x.nome), ["Riso"]);
});

test("esclude i pasti oltre 30 giorni e quelli futuri", () => {
  const pasti = [p("2026-02-01", "cena", "a", "Riso", 80), p("2026-04-05", "cena", "b", "Pasta", 90)];
  assert.deepEqual(alimentiFrequenti(pasti, "cena", OGGI), []);
});

test("senza alimento_id raggruppa per nome e prende l'ultima quantità a parità di giorno", () => {
  const pasti = [
    p("2026-03-29", "spuntino", null, "Mela", 100, "09:00"),
    p("2026-03-29", "spuntino", null, "mela", 180, "16:00"),
  ];
  const r = alimentiFrequenti(pasti, "spuntino", OGGI);
  assert.equal(r.length, 1);
  assert.equal(r[0].alimentoId, null);
  assert.equal(r[0].volte, 2);
  assert.equal(r[0].ultimaQuantitaG, 180);
});

test("rispetta il limite e restituisce vuoto senza dati", () => {
  const pasti = ["a", "b", "c", "d"].map((id, i) => p(`2026-03-2${i}`, "pranzo", id, id, 50));
  assert.equal(alimentiFrequenti(pasti, "pranzo", OGGI, 2).length, 2);
  assert.deepEqual(alimentiFrequenti([], "pranzo", OGGI), []);
});
