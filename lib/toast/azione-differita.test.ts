import test from "node:test";
import assert from "node:assert/strict";
import { creaAzioniDifferite } from "./azione-differita.ts";

function finti() {
  const coda: { fn: () => void; ms: number; vivo: boolean }[] = [];
  return {
    coda,
    timers: {
      set: (fn: () => void, ms: number) => {
        const t = { fn, ms, vivo: true };
        coda.push(t);
        return t;
      },
      clear: (h: unknown) => {
        (h as { vivo: boolean }).vivo = false;
      },
    },
    scatta: () => coda.filter((t) => t.vivo).forEach((t) => ((t.vivo = false), t.fn())),
  };
}

test("l'azione parte allo scadere del ritardo", () => {
  const f = finti();
  const a = creaAzioniDifferite(5000, f.timers);
  let n = 0;
  a.pianifica("x", () => n++);
  assert.equal(f.coda[0].ms, 5000);
  assert.equal(n, 0);
  f.scatta();
  assert.equal(n, 1);
  assert.equal(a.inAttesa(), 0);
});

test("annulla impedisce l'azione", () => {
  const f = finti();
  const a = creaAzioniDifferite(5000, f.timers);
  let n = 0;
  a.pianifica("x", () => n++);
  assert.equal(a.annulla("x"), true);
  f.scatta();
  assert.equal(n, 0);
  assert.equal(a.annulla("x"), false);
});

test("eseguiTutte lancia subito quelle in attesa, una sola volta", () => {
  const f = finti();
  const a = creaAzioniDifferite(5000, f.timers);
  const visti: string[] = [];
  a.pianifica("a", () => visti.push("a"));
  a.pianifica("b", () => visti.push("b"));
  a.eseguiTutte();
  f.scatta();
  assert.deepEqual(visti.sort(), ["a", "b"]);
});

test("ripianificare lo stesso id esegue prima la precedente", () => {
  const f = finti();
  const a = creaAzioniDifferite(5000, f.timers);
  const visti: number[] = [];
  a.pianifica("a", () => visti.push(1));
  a.pianifica("a", () => visti.push(2));
  f.scatta();
  assert.deepEqual(visti, [1, 2]);
});
