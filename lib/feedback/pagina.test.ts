import { test } from "node:test";
import assert from "node:assert/strict";
import { paginaTemplate } from "./pagina.ts";

test("le pagine statiche restano invariate", () => {
  assert.equal(paginaTemplate("/spese/gestione"), "/spese/gestione");
  assert.equal(paginaTemplate("/"), "/");
});

test("uuid, numeri e date diventano [id]", () => {
  assert.equal(paginaTemplate("/carte/3f2a9c1e-1b2d-4c5e-8f90-123456789abc"), "/carte/[id]");
  assert.equal(paginaTemplate("/agenda/evento/42"), "/agenda/evento/[id]");
  assert.equal(paginaTemplate("/agenda/2026-09-27"), "/agenda/[id]");
});

test("query e hash non finiscono nel template", () => {
  assert.equal(paginaTemplate("/spese?mese=2026-09&q=mario"), "/spese");
  assert.equal(paginaTemplate("/investimenti#posizioni"), "/investimenti");
});

test("token lunghi con cifre sono trattati come id, quelli senza cifre no", () => {
  assert.equal(paginaTemplate("/x/abcdef123456abcdef"), "/x/[id]");
  assert.equal(paginaTemplate("/impostazioni/notifiche-giornaliere"), "/impostazioni/notifiche-giornaliere");
});

test("il risultato è limitato a 200 caratteri", () => {
  assert.ok(paginaTemplate(`/${"a".repeat(500)}`).length <= 200);
});
