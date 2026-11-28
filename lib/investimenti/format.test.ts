import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// format.ts reimporta formatCurrency con l'alias "@/", che node:test non risolve: si valuta la sola funzione.
const sorgente = readFileSync(new URL("./format.ts", import.meta.url), "utf8");
const corpo = sorgente.match(/export function formatPercent\(n: number\): string \{([\s\S]*?)\n\}/)![1];
const formatPercent = new Function("n", corpo) as (n: number) => string;

test("le percentuali usano la virgola italiana", () => {
  assert.equal(formatPercent(16.59), "+16,59%");
  assert.equal(formatPercent(-3.5), "-3,50%");
  assert.equal(formatPercent(0), "0,00%");
});
