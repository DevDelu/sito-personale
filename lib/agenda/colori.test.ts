import { test } from "node:test";
import assert from "node:assert/strict";
import { CATEGORIA_COLORE, PALETTE_COLORI_EVENTO, coloreEvento } from "./colori.ts";

test("coloreEvento: il colore proprio vince sulla categoria", () => {
  assert.equal(coloreEvento({ colore: "#d64545", categoria: "ferie" }), "#d64545");
});

test("coloreEvento: senza colore usa quello della categoria", () => {
  assert.equal(coloreEvento({ colore: null, categoria: "visita" }), CATEGORIA_COLORE.visita);
  assert.equal(coloreEvento({ colore: "", categoria: "altro" }), "var(--muted)");
});

test("la palette ha nomi unici e colori hex validi", () => {
  const nomi = new Set(PALETTE_COLORI_EVENTO.map((c) => c.nome));
  assert.equal(nomi.size, PALETTE_COLORI_EVENTO.length);
  for (const c of PALETTE_COLORI_EVENTO) assert.match(c.valore, /^#[0-9a-f]{6}$/i);
});
