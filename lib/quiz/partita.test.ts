import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DOMANDE_PER_PARTITA } from "./types.ts";

test("il punteggio si calcola solo su una partita intera, né più né meno", () => {
  assert.equal(DOMANDE_PER_PARTITA, 5);
  const route = readFileSync(new URL("../../app/api/quiz/submit/route.ts", import.meta.url), "utf8");
  assert.match(route, /answersInput\.length !== DOMANDE_PER_PARTITA/);
});
