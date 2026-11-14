import { test } from "node:test";
import assert from "node:assert/strict";
import { LEZIONI, MODULI } from "./lezioni.ts";
import { GLOSSARIO } from "./glossario.ts";
import { SCENARI } from "./scenari.ts";

test("slug delle lezioni univoci", () => {
  const slug = LEZIONI.map((l) => l.slug);
  assert.equal(new Set(slug).size, slug.length);
});

test("ogni modulo ha almeno una lezione e le lezioni seguono l'ordine dei moduli", () => {
  for (const m of MODULI) assert.ok(LEZIONI.some((l) => l.modulo === m.id), m.id);
  const indici = LEZIONI.map((l) => MODULI.findIndex((m) => m.id === l.modulo));
  assert.deepEqual(indici, [...indici].sort((a, b) => a - b));
});

test("ogni domanda ha la risposta corretta tra le opzioni", () => {
  for (const l of LEZIONI) {
    assert.ok(l.quiz.length > 0, `${l.slug} senza quiz`);
    for (const q of l.quiz) {
      assert.ok(q.corretta >= 0 && q.corretta < q.opzioni.length, `${l.slug}: ${q.domanda}`);
      assert.equal(new Set(q.opzioni).size, q.opzioni.length, `${l.slug}: opzioni doppie`);
    }
  }
});

test("i grafici delle lezioni usano scenari esistenti", () => {
  for (const l of LEZIONI)
    for (const b of l.blocchi) if (b.tipo === "grafico") assert.ok(SCENARI[b.scenario], `${l.slug}: ${b.scenario}`);
});

test("il glossario punta a lezioni esistenti e non ha doppioni", () => {
  const slug = new Set(LEZIONI.map((l) => l.slug));
  for (const v of GLOSSARIO) if (v.lezione) assert.ok(slug.has(v.lezione), `${v.termine} → ${v.lezione}`);
  const termini = GLOSSARIO.map((v) => v.termine.toLowerCase());
  assert.equal(new Set(termini).size, termini.length);
});
