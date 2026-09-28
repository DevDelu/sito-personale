import { test } from "node:test";
import assert from "node:assert/strict";
import { mappaColoriCategorie, pickCategoryColor } from "./category-palette.ts";

const valori = (m: Map<string, string>) => [...m.values()];

// Feedback 27/09: nella torta di Spese le categorie senza colore salvato
// ricadevano tutte sullo stesso colore di default.
test("categorie senza colore salvato ricevono colori tutti diversi", () => {
  const categorie = ["Casa", "Cibo", "Trasporti", "Salute", "Svago", "Shopping", "Bollette"].map(
    (nome) => ({ nome, colore: null })
  );
  const mappa = mappaColoriCategorie(categorie);
  assert.equal(mappa.size, categorie.length);
  assert.equal(new Set(valori(mappa)).size, categorie.length);
});

test("colori doppi in DB vengono separati, il primo per nome tiene il suo", () => {
  const mappa = mappaColoriCategorie([
    { nome: "Palestra", colore: "var(--cat-extra-1)" },
    { nome: "Casa", colore: "var(--cat-extra-1)" },
  ]);
  assert.equal(mappa.get("Casa"), "var(--cat-extra-1)");
  assert.notEqual(mappa.get("Palestra"), "var(--cat-extra-1)");
});

test("i colori salvati e unici restano quelli del DB", () => {
  const mappa = mappaColoriCategorie([
    { nome: "Alimentari", colore: "var(--cat-alimentari)" },
    { nome: "Benzina", colore: "var(--cat-benzina)" },
  ]);
  assert.equal(mappa.get("Alimentari"), "var(--cat-alimentari)");
  assert.equal(mappa.get("Benzina"), "var(--cat-benzina)");
});

test("Altro resta grigio e il grigio non va ad altre categorie", () => {
  const mappa = mappaColoriCategorie([
    { nome: "Altro", colore: null },
    { nome: "Casa", colore: "var(--cat-altro)" },
  ]);
  assert.equal(mappa.get("Altro"), "var(--cat-altro)");
  assert.notEqual(mappa.get("Casa"), "var(--cat-altro)");
});

test("stesso nome (spesa ed entrata) stesso colore, anche con molte categorie", () => {
  const categorie = Array.from({ length: 30 }, (_, i) => ({ nome: `Cat ${i}`, colore: null }));
  categorie.push({ nome: "Cat 3", colore: null });
  const mappa = mappaColoriCategorie(categorie);
  assert.equal(mappa.size, 30);
  assert.equal(new Set(valori(mappa)).size, 30);
});

test("l'ordine di input non cambia i colori", () => {
  const a = [
    { nome: "Casa", colore: null },
    { nome: "Viaggi", colore: null },
    { nome: "Cibo", colore: null },
  ];
  assert.deepEqual(
    [...mappaColoriCategorie(a)].sort(),
    [...mappaColoriCategorie([...a].reverse())].sort()
  );
});

test("una categoria nuova prende un colore non ancora usato", () => {
  const usati = ["var(--cat-extra-3)", "var(--cat-extra-5)"];
  const nuovo = pickCategoryColor(usati);
  assert.ok(!usati.includes(nuovo));
});
