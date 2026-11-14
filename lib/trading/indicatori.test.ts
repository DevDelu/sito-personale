import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bollinger,
  dimensionePosizione,
  ema,
  incroci,
  macd,
  rapportoRischioRendimento,
  ritracciamentiFibonacci,
  rsi,
  sma,
} from "./indicatori.ts";
import { SCENARI, candeleScenario } from "./scenari.ts";

const vicino = (a: number | null, b: number, tolleranza = 1e-6) =>
  assert.ok(a !== null && Math.abs(a - b) < tolleranza, `${a} ≠ ${b}`);

test("SMA: null finché mancano dati, poi media degli ultimi N", () => {
  assert.deepEqual(sma([1, 2, 3, 4, 5], 3), [null, null, 2, 3, 4]);
});

test("EMA: parte dalla SMA e pesa di più l'ultimo valore", () => {
  const e = ema([1, 2, 3, 4, 5], 3);
  assert.deepEqual(e.slice(0, 2), [null, null]);
  vicino(e[2], 2);
  vicino(e[3], 3); // 4*0.5 + 2*0.5
  vicino(e[4], 4);
});

test("RSI: serie solo in salita = 100, solo in discesa = 0", () => {
  const su = Array.from({ length: 30 }, (_, i) => 100 + i);
  const giu = Array.from({ length: 30 }, (_, i) => 100 - i);
  assert.equal(rsi(su).at(-1), 100);
  vicino(rsi(giu).at(-1)!, 0);
  assert.equal(rsi(su)[13], null);
  assert.notEqual(rsi(su)[14], null);
});

test("RSI resta tra 0 e 100 su dati realistici", () => {
  const chiusure = candeleScenario(SCENARI.divergenza).map((c) => c.close);
  for (const v of rsi(chiusure)) if (v !== null) assert.ok(v >= 0 && v <= 100);
});

test("MACD: istogramma = linea − segnale", () => {
  const chiusure = candeleScenario(SCENARI.rialzo).map((c) => c.close);
  const m = macd(chiusure);
  const i = chiusure.length - 1;
  vicino(m.istogramma[i], m.macd[i]! - m.segnale[i]!);
  assert.equal(m.macd[24], null);
  assert.notEqual(m.macd[25], null);
});

test("Bollinger: serie costante → bande sulla media", () => {
  const b = bollinger(Array(25).fill(10), 20);
  vicino(b.alta[24], 10);
  vicino(b.bassa[24], 10);
});

test("Fibonacci: 61,8% di un movimento 100 → 150 è 119,1", () => {
  const l = ritracciamentiFibonacci(100, 150).find((x) => x.livello === 0.618)!;
  vicino(l.prezzo, 119.1);
});

test("incroci: rileva il passaggio sopra e sotto", () => {
  assert.deepEqual(incroci([1, 3, 1], [2, 2, 2]), [
    { indice: 1, tipo: "rialzista" },
    { indice: 2, tipo: "ribassista" },
  ]);
});

test("lo scenario 'incrocio' contiene un golden cross 50/200", () => {
  const chiusure = candeleScenario(SCENARI.incrocio).map((c) => c.close);
  const croci = incroci(sma(chiusure, 50), sma(chiusure, 200));
  assert.ok(croci.some((c) => c.tipo === "rialzista"));
});

test("dimensione posizione: rischio 1% di 10.000 con stop a 5 → 20 azioni", () => {
  const r = dimensionePosizione(10_000, 1, 100, 95);
  assert.equal(r.azioni, 20);
  assert.equal(r.rischioEuro, 100);
  assert.equal(r.controvalore, 2000);
  assert.equal(dimensionePosizione(10_000, 1, 100, 100).azioni, 0);
});

test("rischio/rendimento: ingresso 100, stop 95, target 110 → 2R", () => {
  assert.equal(rapportoRischioRendimento(100, 95, 110), 2);
});

test("generatore deterministico: stesso seme, stesse candele", () => {
  assert.deepEqual(candeleScenario(SCENARI.laterale), candeleScenario(SCENARI.laterale));
  for (const c of candeleScenario(SCENARI.laterale)) {
    assert.ok(c.high >= Math.max(c.open, c.close) && c.low <= Math.min(c.open, c.close));
  }
});
