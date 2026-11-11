import { test } from "node:test";
import assert from "node:assert/strict";
import { categoryColor, resolveCategoryColor } from "./category-style.ts";

test("categoryColor usa la variabile CSS della categoria nota", () => {
  assert.equal(categoryColor("Alimentari"), "var(--cat-alimentari)");
  assert.equal(categoryColor("Stipendio"), "var(--cat-stipendio)");
});

test("categoryColor ricade su 'Altro' per nomi sconosciuti o assenti", () => {
  assert.equal(categoryColor("Inesistente"), "var(--cat-altro)");
  assert.equal(categoryColor(null), "var(--cat-altro)");
  assert.equal(categoryColor(undefined), "var(--cat-altro)");
  assert.equal(categoryColor(""), "var(--cat-altro)");
});

test("resolveCategoryColor preferisce il colore salvato in DB", () => {
  assert.equal(resolveCategoryColor("Alimentari", "var(--cat-custom)"), "var(--cat-custom)");
  assert.equal(resolveCategoryColor("Alimentari", null), "var(--cat-alimentari)");
  assert.equal(resolveCategoryColor("Alimentari", ""), "var(--cat-alimentari)");
  assert.equal(resolveCategoryColor(null, undefined), "var(--cat-altro)");
});
