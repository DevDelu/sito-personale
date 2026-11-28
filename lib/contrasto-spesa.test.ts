import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const scuro = css.slice(css.indexOf('[data-theme="dark"] {'));
const colore = (nome: string) => scuro.match(new RegExp(`--${nome}: (#[0-9a-f]{6});`))![1];

function luminanza(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrasto(a: string, b: string) {
  const [x, y] = [luminanza(a), luminanza(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

test("tema scuro: il rosso delle spese si legge (WCAG AA, 4.5:1)", () => {
  for (const sfondo of ["background", "surface", "surface-hover"]) {
    assert.ok(contrasto(colore("spesa"), colore(sfondo)) >= 4.5, sfondo);
  }
  assert.ok(contrasto("#ffffff", colore("spesa-pieno")) >= 4.5, "testo bianco sul pulsante di eliminazione");
});
