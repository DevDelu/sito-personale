import { test } from "node:test";
import assert from "node:assert/strict";
import { categoriaPerNome } from "./categorie.ts";

const CATEGORIE = [
  { id: "1", nome: "Caffè", tipo: "spesa" },
  { id: "2", nome: "Altro", tipo: "spesa" },
  { id: "3", nome: "Altro", tipo: "entrata" },
  { id: "4", nome: "Stipendio", tipo: "entrata" },
];

test("combacia ignorando maiuscole e accenti", () => {
  assert.deepEqual(categoriaPerNome("caffe", CATEGORIE, "spesa"), { id: "1", nome: "Caffè", riconosciuta: true });
});

test("rispetta il tipo: una categoria di entrata non vale per una spesa", () => {
  assert.equal(categoriaPerNome("Stipendio", CATEGORIE, "spesa").id, "2");
});

test("sconosciuta o assente → Altro del tipo giusto", () => {
  assert.deepEqual(categoriaPerNome("Viaggi su Marte", CATEGORIE, "spesa"), { id: "2", nome: "Altro", riconosciuta: false });
  assert.equal(categoriaPerNome(undefined, CATEGORIE, "entrata").id, "3");
});
