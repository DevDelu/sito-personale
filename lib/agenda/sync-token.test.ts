import { test } from "node:test";
import assert from "node:assert/strict";
import { tokenDaSalvare, verificaScrittura } from "./sync-token.ts";

test("pull senza errori: si avanza al token nuovo", () => {
  assert.equal(tokenDaSalvare(0, "nuovo", "vecchio"), "nuovo");
});

test("pull con errori: resta il token precedente, così Google rimanda le modifiche", () => {
  assert.equal(tokenDaSalvare(1, "nuovo", "vecchio"), "vecchio");
  assert.equal(tokenDaSalvare(2, "nuovo", null), null);
});

test("Google non manda un token: resta quello precedente", () => {
  assert.equal(tokenDaSalvare(0, null, "vecchio"), "vecchio");
});

test("un errore nella risposta di supabase-js diventa un'eccezione", () => {
  assert.throws(() => verificaScrittura({ error: { message: "scrittura rifiutata" } }), /scrittura rifiutata/);
  assert.doesNotThrow(() => verificaScrittura({ error: null }));
});

test("sync completa: si avanza anche con errori, senza tornare al token scaduto", () => {
  assert.equal(tokenDaSalvare(1, "nuovo", "scaduto", true), "nuovo");
  assert.equal(tokenDaSalvare(1, null, "scaduto", true), null);
});
