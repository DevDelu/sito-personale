import { test } from "node:test";
import assert from "node:assert/strict";
import { calcolaFifo } from "./fifo.ts";
import type { CostoTipo, Transazione } from "./types.ts";

function tx(
  tipo: "buy" | "sell",
  data: string,
  quantita: number,
  prezzo: number | null,
  costo_tipo: CostoTipo = "verificato",
): Transazione {
  return { id: `${tipo}-${data}`, asset_id: "a", tipo, quantita, prezzo_unitario: prezzo, data, costo_tipo, note: null };
}

test("nessuna transazione → tutto a zero", () => {
  assert.deepEqual(calcolaFifo([]), {
    quantitaNetta: 0,
    quantitaCostoNoto: 0,
    costoTotaleCarico: 0,
    hasStimato: false,
    hasSconosciuto: false,
  });
});

test("la vendita consuma prima il lotto più vecchio", () => {
  const r = calcolaFifo([tx("buy", "2026-01-01", 10, 100), tx("buy", "2026-02-01", 10, 200), tx("sell", "2026-03-01", 15, 300)]);
  assert.equal(r.quantitaNetta, 5);
  // restano 5 quote del lotto da 200
  assert.equal(r.costoTotaleCarico, 1000);
});

test("l'ordine di input non conta: si ordina per data", () => {
  const r = calcolaFifo([tx("sell", "2026-03-01", 15, 300), tx("buy", "2026-02-01", 10, 200), tx("buy", "2026-01-01", 10, 100)]);
  assert.equal(r.quantitaNetta, 5);
  assert.equal(r.costoTotaleCarico, 1000);
});

test("lotti sconosciuti: nella quantità netta ma fuori dal costo", () => {
  const r = calcolaFifo([tx("buy", "2026-01-01", 4, null, "sconosciuto"), tx("buy", "2026-02-01", 6, 50)]);
  assert.equal(r.quantitaNetta, 10);
  assert.equal(r.quantitaCostoNoto, 6);
  assert.equal(r.costoTotaleCarico, 300);
  assert.equal(r.hasSconosciuto, true);
  assert.equal(r.hasStimato, false);
});

test("flag stimato, e vendita totale azzera la posizione", () => {
  const r = calcolaFifo([tx("buy", "2026-01-01", 2.5, 10, "stimato"), tx("sell", "2026-02-01", 2.5, 12)]);
  assert.equal(r.hasStimato, true);
  assert.equal(r.quantitaNetta, 0);
  assert.equal(r.costoTotaleCarico, 0);
});

test("vendita oltre la quantità posseduta non va in negativo", () => {
  const r = calcolaFifo([tx("buy", "2026-01-01", 1, 10), tx("sell", "2026-02-01", 5, 12)]);
  assert.equal(r.quantitaNetta, 0);
});
