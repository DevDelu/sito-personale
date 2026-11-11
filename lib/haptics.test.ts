import { test } from "node:test";
import assert from "node:assert/strict";
import { eseguiTocco } from "./haptics.ts";

const base = { riduciMovimento: false, disattivata: false, tickSwitch: () => {} };

test("usa vibrate quando esiste", () => {
  let ms = 0;
  assert.equal(eseguiTocco({ ...base, vibrate: (n) => ((ms = n), true) }), true);
  assert.equal(ms, 10);
});

test("senza vibrate usa il trucco dello switch", () => {
  let chiamato = false;
  assert.equal(eseguiTocco({ ...base, tickSwitch: () => (chiamato = true) }), true);
  assert.equal(chiamato, true);
});

test("niente tocco con riduci movimento o se disattivato", () => {
  assert.equal(eseguiTocco({ ...base, riduciMovimento: true }), false);
  assert.equal(eseguiTocco({ ...base, disattivata: true }), false);
});

test("un errore non si propaga", () => {
  assert.equal(
    eseguiTocco({ ...base, tickSwitch: () => { throw new Error("x"); } }),
    false,
  );
});
