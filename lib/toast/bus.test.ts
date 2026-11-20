import test from "node:test";
import assert from "node:assert/strict";
import { mostraToast, registraToast, type ToastAttivo } from "./bus.ts";

test("senza host il toast non viene mostrato", () => {
  registraToast(null);
  assert.equal(mostraToast({ testo: "Fatto" }), false);
});

test("con host il toast arriva con id crescente", () => {
  const visti: ToastAttivo[] = [];
  registraToast((t) => visti.push(t));
  assert.equal(mostraToast({ testo: "Uno" }), true);
  assert.equal(mostraToast({ testo: "  Due  " }), true);
  registraToast(null);
  assert.deepEqual(visti.map((t) => t.testo), ["Uno", "Due"]);
  assert.ok(visti[1].id > visti[0].id);
});

test("un testo vuoto non fa comparire nulla", () => {
  const visti: ToastAttivo[] = [];
  registraToast((t) => visti.push(t));
  assert.equal(mostraToast({ testo: "   " }), false);
  registraToast(null);
  assert.equal(visti.length, 0);
});
