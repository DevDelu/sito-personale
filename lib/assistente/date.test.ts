import { test } from "node:test";
import assert from "node:assert/strict";
import { dataValida, giornoSettimana, oggiRoma } from "./date.ts";

test("oggiRoma: dopo la mezzanotte italiana è già il giorno dopo", () => {
  // 23:30 UTC del 17/11 = 00:30 del 18/11 a Roma (UTC+1).
  assert.equal(oggiRoma(new Date("2026-11-17T23:30:00Z")), "2026-11-18");
  assert.equal(oggiRoma(new Date("2026-11-18T10:00:00Z")), "2026-11-18");
});

test("dataValida: solo ISO reali e non oltre domani", () => {
  const oggi = "2026-11-18";
  assert.equal(dataValida("2026-11-18", oggi), true);
  assert.equal(dataValida("2026-11-19", oggi), true);
  assert.equal(dataValida("2026-11-20", oggi), false);
  assert.equal(dataValida("2026-02-30", oggi), false);
  assert.equal(dataValida("18/11/2026", oggi), false);
  assert.equal(dataValida(undefined, oggi), false);
});

test("giornoSettimana", () => {
  assert.equal(giornoSettimana("2026-11-18"), "mercoledì");
});
