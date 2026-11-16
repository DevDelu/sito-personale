import { test } from "node:test";
import assert from "node:assert/strict";
import { meseScorso } from "./mese-scorso.ts";

test("mese scorso a metà anno", () => {
  assert.deepEqual(meseScorso("2026-11-15"), { from: "2026-10-01", to: "2026-10-31" });
});
test("gennaio torna a dicembre dell'anno prima", () => {
  assert.deepEqual(meseScorso("2026-01-03"), { from: "2025-12-01", to: "2025-12-31" });
});
test("marzo con febbraio bisestile", () => {
  assert.deepEqual(meseScorso("2028-03-31"), { from: "2028-02-01", to: "2028-02-29" });
});
