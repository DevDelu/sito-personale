import { test } from "node:test";
import assert from "node:assert/strict";
import { OPZIONI_VAD, passoVad, rmsDa, statoIniziale, type EventoVad, type StatoVad } from "./vad.ts";

// Simula una sequenza di livelli RMS a frame da 50 ms; restituisce gli eventi.
function simula(livelli: [number, number][], moltiplicatore = 1): { eventi: EventoVad[]; stato: StatoVad } {
  let stato = statoIniziale();
  const eventi: EventoVad[] = [];
  for (const [rms, ms] of livelli) {
    for (let t = 0; t < ms; t += 50) {
      const r = passoVad(stato, rms, 50, OPZIONI_VAD, moltiplicatore);
      stato = r.stato;
      if (r.evento) eventi.push(r.evento);
    }
  }
  return { eventi, stato };
}

test("frase normale: inizio, poi fine dopo il silenzio", () => {
  const { eventi } = simula([[0.003, 1000], [0.1, 1500], [0.003, 1200]]);
  assert.deepEqual(eventi, ["inizio", "fine"]);
});

test("una pausa breve dentro la frase non la chiude", () => {
  const { eventi } = simula([[0.003, 800], [0.1, 800], [0.003, 400], [0.1, 800], [0.003, 1200]]);
  assert.deepEqual(eventi, ["inizio", "fine"]);
});

test("un colpo breve (tosse, porta) viene scartato", () => {
  const { eventi } = simula([[0.003, 800], [0.1, 200], [0.003, 1200]]);
  assert.deepEqual(eventi, ["inizio", "scarta"]);
});

test("il silenzio non fa partire nulla e il rumore di fondo si adatta", () => {
  const { eventi, stato } = simula([[0.008, 5000]]);
  assert.deepEqual(eventi, []);
  assert.ok(stato.rumore > 0.007);
});

test("in strada (rumore alto) la soglia sale: il rumore non è voce", () => {
  const { eventi } = simula([[0.02, 4000], [0.025, 2000]]);
  assert.deepEqual(eventi, []);
});

test("durante la risposta vocale serve più voce per interrompere (eco)", () => {
  assert.deepEqual(simula([[0.003, 800], [0.03, 1000]], 3).eventi, []);
  assert.deepEqual(simula([[0.003, 800], [0.2, 1000]], 3).eventi, ["inizio"]);
});

test("frase lunghissima: chiusa al massimo previsto", () => {
  const { eventi } = simula([[0.003, 800], [0.1, OPZIONI_VAD.maxParlatoMs + 500]]);
  assert.deepEqual(eventi.slice(0, 2), ["inizio", "fine"]);
});

test("rmsDa", () => {
  assert.equal(rmsDa(new Float32Array([0, 0, 0])), 0);
  assert.ok(Math.abs(rmsDa(new Float32Array([0.5, -0.5])) - 0.5) < 1e-9);
});
