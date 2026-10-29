import { test } from "node:test";
import assert from "node:assert/strict";
import { oggiItaliaISO, settimanaCorrenteItalia } from "./data-italia.ts";

test("oggi in Italia: dopo mezzanotte italiana UTC è ancora il giorno prima", () => {
  // 22:30 UTC del 28/10 = 23:30 CET → ancora 28
  assert.equal(oggiItaliaISO(new Date("2026-10-28T22:30:00Z")), "2026-10-28");
  // 23:30 UTC del 28/10 = 00:30 CET del 29
  assert.equal(oggiItaliaISO(new Date("2026-10-28T23:30:00Z")), "2026-10-29");
});

test("oggi in Italia: ora legale (CEST, UTC+2)", () => {
  assert.equal(oggiItaliaISO(new Date("2026-07-14T21:59:00Z")), "2026-07-14");
  assert.equal(oggiItaliaISO(new Date("2026-07-14T22:00:00Z")), "2026-07-15");
});

test("settimana: giovedì → lunedì-domenica della stessa settimana", () => {
  assert.deepEqual(settimanaCorrenteItalia(new Date("2026-10-29T10:00:00Z")), {
    inizio: "2026-10-26",
    fine: "2026-11-01",
  });
});

test("settimana: la domenica appartiene alla settimana che finisce quel giorno", () => {
  assert.deepEqual(settimanaCorrenteItalia(new Date("2026-11-01T10:00:00Z")), {
    inizio: "2026-10-26",
    fine: "2026-11-01",
  });
});

test("settimana: domenica sera UTC ma già lunedì in Italia → settimana nuova", () => {
  assert.deepEqual(settimanaCorrenteItalia(new Date("2026-11-01T23:30:00Z")), {
    inizio: "2026-11-02",
    fine: "2026-11-08",
  });
});

test("settimana: attraversa il cambio d'anno", () => {
  assert.deepEqual(settimanaCorrenteItalia(new Date("2026-12-31T12:00:00Z")), {
    inizio: "2026-12-28",
    fine: "2027-01-03",
  });
});
