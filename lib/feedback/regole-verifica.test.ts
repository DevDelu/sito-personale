import { test } from "node:test";
import assert from "node:assert/strict";
import { daVerificareQui, puoMostrareVerifica, type ContestoVerifica } from "./regole-verifica.ts";

const base: ContestoVerifica = {
  mostratiInSessione: 0,
  inSessioneAllenamento: false,
  campoConFocus: false,
  sheetAperto: false,
};

test("al massimo un avviso di verifica per sessione", () => {
  assert.equal(puoMostrareVerifica(base), true);
  assert.equal(puoMostrareVerifica({ ...base, mostratiInSessione: 1 }), false);
});

test("mai durante una sessione di allenamento, con un campo in focus o sopra uno sheet", () => {
  assert.equal(puoMostrareVerifica({ ...base, inSessioneAllenamento: true }), false);
  assert.equal(puoMostrareVerifica({ ...base, campoConFocus: true }), false);
  assert.equal(puoMostrareVerifica({ ...base, sheetAperto: true }), false);
});

test("solo il feedback della pagina corrente, il più vecchio per primo", () => {
  const lista = [
    { id: "1", route: "/spese/gestione" },
    { id: "2", route: "/spese" },
    { id: "3", route: "/spese/gestione" },
  ];
  assert.equal(daVerificareQui(lista, "/spese/gestione")?.id, "1");
  assert.equal(daVerificareQui(lista, "/agenda"), null);
});
