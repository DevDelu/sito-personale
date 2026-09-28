import { test } from "node:test";
import assert from "node:assert/strict";
import { calcolaRiepilogo, etaInNotti } from "./riepilogo.ts";

test("contatori, tempo medio fino a verificato e tasso di riapertura", () => {
  const r = calcolaRiepilogo(
    [
      { id: "a", created_at: "2026-09-20T10:00:00Z", stato: "verificato", riaperture: 0 },
      { id: "b", created_at: "2026-09-20T10:00:00Z", stato: "verificato", riaperture: 1 },
      { id: "c", created_at: "2026-09-25T10:00:00Z", stato: "da-verificare", riaperture: 0 },
      { id: "d", created_at: "2026-09-26T10:00:00Z", stato: "nuovo", riaperture: 0 },
    ],
    [
      { feedback_id: "a", created_at: "2026-09-22T10:00:00Z" },
      { feedback_id: "b", created_at: "2026-09-21T10:00:00Z" },
      { feedback_id: "b", created_at: "2026-09-24T10:00:00Z" },
    ]
  );
  assert.equal(r.totale, 4);
  assert.equal(r.perStato.verificato, 2);
  assert.equal(r.perStato.nuovo, 1);
  // a: 2 giorni, b: 4 giorni (conta l'ultima verifica) → media 3.
  assert.equal(r.giorniMediVerifica, 3);
  // a, b, c arrivati a verifica; b riaperto → 1/3.
  assert.equal(r.tassoRiapertura, 1 / 3);
});

test("senza dati: null invece di numeri fuorvianti", () => {
  const r = calcolaRiepilogo([{ id: "d", created_at: "2026-09-26T10:00:00Z", stato: "nuovo", riaperture: 0 }], []);
  assert.equal(r.giorniMediVerifica, null);
  assert.equal(r.tassoRiapertura, null);
});

test("età in notti", () => {
  const adesso = new Date("2026-09-28T09:00:00Z");
  assert.equal(etaInNotti("2026-09-28T01:00:00Z", adesso), "stanotte");
  assert.equal(etaInNotti("2026-09-27T01:00:00Z", adesso), "1 notte fa");
  assert.equal(etaInNotti("2026-09-25T01:00:00Z", adesso), "3 notti fa");
});
