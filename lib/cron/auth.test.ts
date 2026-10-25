import { test } from "node:test";
import assert from "node:assert/strict";
import { cronAutorizzato, rifiutaSeNonCron } from "./auth.ts";

test("secret assente: sempre rifiutato, anche senza header", () => {
  assert.equal(cronAutorizzato(null, undefined), false);
  assert.equal(cronAutorizzato("Bearer ", undefined), false);
  assert.equal(cronAutorizzato("Bearer undefined", undefined), false);
});

test("secret vuota: rifiutato", () => {
  assert.equal(cronAutorizzato("Bearer ", ""), false);
  assert.equal(cronAutorizzato(null, ""), false);
});

test("secret presente: header corretto accettato", () => {
  assert.equal(cronAutorizzato("Bearer abc123", "abc123"), true);
});

test("secret presente: header mancante o sbagliato rifiutato", () => {
  assert.equal(cronAutorizzato(null, "abc123"), false);
  assert.equal(cronAutorizzato("Bearer abc124", "abc123"), false);
  assert.equal(cronAutorizzato("abc123", "abc123"), false);
  assert.equal(cronAutorizzato("Bearer abc1234", "abc123"), false);
});

test("rifiutaSeNonCron legge CRON_SECRET dall'ambiente", () => {
  const prima = process.env.CRON_SECRET;
  try {
    delete process.env.CRON_SECRET;
    const senza = rifiutaSeNonCron(new Request("http://x/api/cron/y"));
    assert.equal(senza?.status, 401);

    process.env.CRON_SECRET = "s3";
    const ok = rifiutaSeNonCron(
      new Request("http://x/api/cron/y", { headers: { authorization: "Bearer s3" } }),
    );
    assert.equal(ok, null);
    const ko = rifiutaSeNonCron(new Request("http://x/api/cron/y"));
    assert.equal(ko?.status, 401);
  } finally {
    if (prima === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = prima;
  }
});
