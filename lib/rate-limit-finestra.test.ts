import { test } from "node:test";
import assert from "node:assert/strict";
import { checkRateLimit, dimensioneRateLimit } from "./rate-limit-finestra.ts";

test("blocca oltre il massimo e riapre dopo la finestra", () => {
  const o = { max: 2, windowMs: 1000 };
  assert.equal(checkRateLimit("a", o, 0).allowed, true);
  assert.equal(checkRateLimit("a", o, 10).allowed, true);
  const r = checkRateLimit("a", o, 20);
  assert.equal(r.allowed, false);
  assert.equal(r.retryAfterMs, 980);
  assert.equal(checkRateLimit("a", o, 1001).allowed, true);
});

test("le chiavi scadute vengono eliminate oltre la soglia", () => {
  const o = { max: 1, windowMs: 1000 };
  for (let i = 0; i < 1100; i++) checkRateLimit(`ip${i}`, o, 0);
  assert.ok(dimensioneRateLimit() > 1000);
  checkRateLimit("nuova", o, 5000);
  assert.ok(dimensioneRateLimit() < 10);
});
