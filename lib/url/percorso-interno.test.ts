import { test } from "node:test";
import assert from "node:assert/strict";
import { percorsoInterno } from "./percorso-interno.ts";

test("i percorsi del sito restano com'erano", () => {
  assert.equal(percorsoInterno("/spese", "/"), "/spese");
  assert.equal(percorsoInterno("/reset-password", "/"), "/reset-password");
  assert.equal(percorsoInterno("/spese/gestione?mese=2026-11#lista", "/"), "/spese/gestione?mese=2026-11#lista");
});

test("tutto ciò che porta fuori dal sito va al ripiego", () => {
  for (const v of ["https://example.org", "//example.org", "/\\example.org", "/\t/example.org", "/.//example.org", "spese", "", null, undefined]) {
    assert.equal(percorsoInterno(v, "/spese"), "/spese", JSON.stringify(v));
  }
});
