import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { SPLASH_IPHONE, percorsoSplash, mediaSplash } from "./splash.ts";

test("ogni schermata di avvio dichiarata ha il suo file in public/", () => {
  for (const s of SPLASH_IPHONE) {
    assert.ok(existsSync(`public${percorsoSplash(s)}`), percorsoSplash(s));
  }
});

test("la media query indica larghezza, altezza e densità", () => {
  const m = mediaSplash({ w: 390, h: 844, dpr: 3 });
  assert.match(m, /device-width: 390px/);
  assert.match(m, /device-height: 844px/);
  assert.match(m, /pixel-ratio: 3/);
});
