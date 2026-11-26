import { test } from "node:test";
import assert from "node:assert/strict";
import { diagnosiAccesso } from "../../tests/e2e/diagnosi-accesso.ts";

const base = "https://esempio.test";

test("402 di Vercel: il collaudo si ferma dicendo che il sito è sospeso", () => {
  const motivo = diagnosiAccesso(base, { status: 402, location: null, erroreVercel: "DEPLOYMENT_DISABLED" }, false);
  assert.match(motivo, /^Collaudo fermato: esempio\.test è sospeso da Vercel \(402 DEPLOYMENT_DISABLED\)/);
});

test("402 con header inatteso: l'header non finisce nei log", () => {
  const motivo = diagnosiAccesso(base, { status: 402, location: null, erroreVercel: "<testo> libero" }, false);
  assert.doesNotMatch(motivo, /testo/);
});

test("200: nessun motivo di fermarsi", () => {
  assert.equal(diagnosiAccesso(base, { status: 200, location: null }, false), null);
});
