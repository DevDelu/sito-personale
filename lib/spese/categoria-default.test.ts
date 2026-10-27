import { test } from "node:test";
import assert from "node:assert/strict";
import { risolviCategoriaId } from "./categoria-default.ts";

const categorie = [
  { id: "a1", nome: "Altro", tipo: "spesa" },
  { id: "a2", nome: "Altro", tipo: "entrata" },
  { id: "c1", nome: "Cibo", tipo: "spesa" },
];

test("categoria scelta resta quella scelta", () => {
  assert.equal(risolviCategoriaId("c1", categorie, "spesa"), "c1");
});

test("senza categoria usa Altro del tipo giusto", () => {
  assert.equal(risolviCategoriaId("", categorie, "spesa"), "a1");
  assert.equal(risolviCategoriaId("", categorie, "entrata"), "a2");
});

test("senza categoria e senza Altro restituisce null", () => {
  assert.equal(risolviCategoriaId("", [categorie[2]], "spesa"), null);
});
