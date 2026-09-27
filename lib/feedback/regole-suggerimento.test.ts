// Eseguito con `npm test` (node:test + type stripping nativo di Node 22):
// nessun runner in più tra le dipendenze.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  STATO_SUGGERIMENTO_INIZIALE,
  dopoAccettato,
  dopoIgnorato,
  dopoMostrato,
  puoMostrareSuggerimento,
  type ContestoSuggerimento,
} from "./regole-suggerimento.ts";
import { paginaTemplate } from "./pagina.ts";

const base: ContestoSuggerimento = {
  pagina: "/spese/gestione",
  oggi: "2026-09-27",
  adesso: new Date("2026-09-27T10:00:00Z"),
  inSessioneAllenamento: false,
  campoConFocus: false,
  sheetAperto: false,
};

test("mostrato la prima volta", () => {
  assert.equal(puoMostrareSuggerimento(STATO_SUGGERIMENTO_INIZIALE, base), true);
});

test("mai durante sessione di allenamento, con un campo a fuoco o sopra uno sheet", () => {
  assert.equal(puoMostrareSuggerimento(STATO_SUGGERIMENTO_INIZIALE, { ...base, inSessioneAllenamento: true }), false);
  assert.equal(puoMostrareSuggerimento(STATO_SUGGERIMENTO_INIZIALE, { ...base, campoConFocus: true }), false);
  assert.equal(puoMostrareSuggerimento(STATO_SUGGERIMENTO_INIZIALE, { ...base, sheetAperto: true }), false);
});

test("al massimo una volta al giorno", () => {
  const stato = dopoMostrato(STATO_SUGGERIMENTO_INIZIALE, "/agenda", "2026-09-27");
  assert.equal(puoMostrareSuggerimento(stato, base), false);
  assert.equal(puoMostrareSuggerimento(stato, { ...base, oggi: "2026-09-28" }), true);
});

test("mai due volte di fila sulla stessa pagina, anche a giorni diversi", () => {
  const stato = dopoMostrato(STATO_SUGGERIMENTO_INIZIALE, "/spese/gestione", "2026-09-26");
  assert.equal(puoMostrareSuggerimento(stato, base), false);
  assert.equal(puoMostrareSuggerimento(stato, { ...base, pagina: "/agenda" }), true);
});

test("ignorato 3 volte di fila: pausa di 7 giorni", () => {
  let stato = STATO_SUGGERIMENTO_INIZIALE;
  stato = dopoIgnorato(stato, base.adesso);
  stato = dopoIgnorato(stato, base.adesso);
  assert.equal(stato.pausaFino, undefined);
  stato = dopoIgnorato(stato, base.adesso);
  assert.ok(stato.pausaFino);

  const domani = { ...base, oggi: "2026-09-28", pagina: "/agenda", adesso: new Date("2026-09-28T10:00:00Z") };
  assert.equal(puoMostrareSuggerimento(stato, domani), false);
  const traOttoGiorni = { ...domani, oggi: "2026-10-05", adesso: new Date("2026-10-05T10:00:00Z") };
  assert.equal(puoMostrareSuggerimento(stato, traOttoGiorni), true);
});

test("un tap azzera il conteggio degli ignorati", () => {
  let stato = dopoIgnorato(dopoIgnorato(STATO_SUGGERIMENTO_INIZIALE, base.adesso), base.adesso);
  stato = dopoAccettato(stato);
  stato = dopoIgnorato(stato, base.adesso);
  assert.equal(stato.ignoratiDiFila, 1);
  assert.equal(stato.pausaFino, undefined);
});

test("paginaTemplate sostituisce gli id con [id]", () => {
  assert.equal(paginaTemplate("/carte/3f2a1b4c-1111-2222-3333-444455556666"), "/carte/[id]");
  assert.equal(paginaTemplate("/allenamenti/sessione/42?x=1"), "/allenamenti/sessione/[id]");
  assert.equal(paginaTemplate("/agenda/2026-09-27"), "/agenda/[id]");
  assert.equal(paginaTemplate("/spese/gestione"), "/spese/gestione");
  assert.equal(paginaTemplate("/"), "/");
});
