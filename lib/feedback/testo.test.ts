import { test } from "node:test";
import assert from "node:assert/strict";
import { spezzaTesto } from "./testo.ts";

test("un testo corto resta intero", () => {
  assert.deepEqual(spezzaTesto("  ciao mondo  ", 500), ["ciao mondo"]);
});

test("un testo lungo si spezza sugli spazi senza perdere parole", () => {
  const parole = Array.from({ length: 300 }, (_, i) => `parola${i}`);
  const testo = parole.join(" ");
  const parti = spezzaTesto(testo, 500);
  assert.ok(parti.length > 1);
  for (const p of parti) assert.ok(p.length <= 500);
  assert.equal(parti.join(" "), testo);
});

test("una parola più lunga del limite si taglia a metà", () => {
  const parti = spezzaTesto("x".repeat(1200), 500);
  assert.deepEqual(parti.map((p) => p.length), [500, 500, 200]);
});
