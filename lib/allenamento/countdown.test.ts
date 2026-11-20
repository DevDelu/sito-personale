import { test } from "node:test";
import assert from "node:assert/strict";
import { beepDaSuonare, secondiRimasti } from "./countdown.ts";

test("secondiRimasti arrotonda per eccesso e non scende sotto zero", () => {
  assert.equal(secondiRimasti(10_000, 0), 10);
  assert.equal(secondiRimasti(10_000, 100), 10);
  assert.equal(secondiRimasti(10_000, 9_001), 1);
  assert.equal(secondiRimasti(10_000, 10_000), 0);
  assert.equal(secondiRimasti(10_000, 25_000), 0);
});

test("beepDaSuonare: un beep per ogni secondo 5..1 attraversato", () => {
  assert.deepEqual(beepDaSuonare(10, 9), []);
  assert.deepEqual(beepDaSuonare(6, 5), [5]);
  assert.deepEqual(beepDaSuonare(7, 4), [5, 4]);
  assert.deepEqual(beepDaSuonare(3, 0), [2, 1]);
});

test("dopo un lungo salto (schermo bloccato) non si accumulano beep oltre 5", () => {
  assert.deepEqual(beepDaSuonare(40, 0), [5, 4, 3, 2, 1]);
});
