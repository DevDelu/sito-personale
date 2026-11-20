import { test } from "node:test";
import assert from "node:assert/strict";
import { etichettaGiorno, giornoRoma } from "./date.ts";

test("giornoRoma: dopo mezzanotte italiana è già il giorno dopo", () => {
  assert.equal(giornoRoma("2026-11-18T23:30:00Z"), "2026-11-19");
});

test("etichettaGiorno: oggi, ieri, poi data estesa", () => {
  const adesso = new Date("2026-11-18T10:00:00Z");
  assert.equal(etichettaGiorno("2026-11-18", adesso), "Oggi");
  assert.equal(etichettaGiorno("2026-11-17", adesso), "Ieri");
  assert.equal(etichettaGiorno("2026-11-16", adesso), "Lunedì 16 novembre");
});
