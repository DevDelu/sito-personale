import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

// Se <main> trattiene l'animazione di opacità, la tab bar copre i pulsanti dei fogli.
test("il contenuto privato non trattiene l'animazione di ingresso", () => {
  assert.match(css, /\.app-page-content\.animate-fade-in\s*\{\s*animation-fill-mode:\s*backwards;/);
});
