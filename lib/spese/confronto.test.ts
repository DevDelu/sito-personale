import { test } from "node:test";
import assert from "node:assert/strict";
import { confrontaTotali, periodoPrecedente } from "./confronto.ts";

test("periodo precedente: stessa durata, subito prima", () => {
  assert.deepEqual(periodoPrecedente("2026-10-01", "2026-10-28"), { from: "2026-09-03", to: "2026-09-30" });
  assert.deepEqual(periodoPrecedente("2026-10-22", "2026-10-28"), { from: "2026-10-15", to: "2026-10-21" });
});

test("periodo di un giorno e cambio anno", () => {
  assert.deepEqual(periodoPrecedente("2026-01-01", "2026-01-01"), { from: "2025-12-31", to: "2025-12-31" });
});

test("periodo invertito o date non valide", () => {
  assert.equal(periodoPrecedente("2026-10-28", "2026-10-01"), null);
  assert.equal(periodoPrecedente("boh", "2026-10-01"), null);
});

test("confronto: su, giù, uguale", () => {
  assert.deepEqual(confrontaTotali(112, 100), { percentuale: 12, direzione: "su" });
  assert.deepEqual(confrontaTotali(80, 100), { percentuale: 20, direzione: "giu" });
  assert.deepEqual(confrontaTotali(100, 100), { percentuale: 0, direzione: "uguale" });
});

test("confronto: precedente zero o non valido → nessuna riga", () => {
  assert.equal(confrontaTotali(50, 0), null);
  assert.equal(confrontaTotali(50, -3), null);
  assert.equal(confrontaTotali(Number.NaN, 10), null);
});
