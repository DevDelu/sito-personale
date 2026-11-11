import { test } from "node:test";
import assert from "node:assert/strict";
import { interceptSessionNav, setSessionNavGuard } from "./session-guard.ts";

test("senza handler la navigazione non viene intercettata", () => {
  setSessionNavGuard(null);
  assert.equal(interceptSessionNav("/spese"), false);
});

test("con handler registrato intercetta e gli passa l'href", () => {
  const visti: string[] = [];
  setSessionNavGuard((href) => visti.push(href));
  assert.equal(interceptSessionNav("/spese"), true);
  assert.deepEqual(visti, ["/spese"]);
  setSessionNavGuard(null);
  assert.equal(interceptSessionNav("/spese"), false);
});
