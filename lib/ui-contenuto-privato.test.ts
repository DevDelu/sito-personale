import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

// Se un contenitore trattiene l'animazione, la tab bar copre i pulsanti dei fogli aperti lì dentro.
test("le animazioni d'ingresso non restano applicate a fine corsa", () => {
  const ingressi = [...css.matchAll(/--animate-(fade-in|scale-in|slide-up|slide-down|pop-in|count-up):([^;]*);/g)];
  assert.equal(ingressi.length, 6);
  for (const [, nome, valore] of ingressi) assert.match(valore, / backwards$/, nome);
});

// Senza quello stacking context, i contenuti z-20 di <main> passerebbero sopra una barra di pari livello.
test("la barra in alto da desktop sta sopra i contenuti z-20 della pagina", () => {
  const layout = readFileSync(new URL("../app/(private)/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /sticky top-0 z-30 hidden/);
});
