import { test } from "node:test";
import assert from "node:assert/strict";
import { prossimiImpegni } from "./prossimi.ts";
import type { Evento } from "./types.ts";

function evento(id: string, data_inizio: string, data_fine: string, tutto_il_giorno = false): Evento {
  return {
    id,
    titolo: id,
    descrizione: null,
    luogo: null,
    data_inizio,
    data_fine,
    tutto_il_giorno,
    categoria: "personale",
    colore: null,
    google_event_id: null,
    source: "manuale",
    sync_status: "synced",
    created_at: data_inizio,
    updated_at: data_inizio,
  };
}

// Ora locale: i test girano col fuso della macchina, quindi date costruite
// in locale e non in UTC.
const adesso = new Date(2026, 8, 28, 10, 0); // lun 28/09 10:00
const iso = (g: number, h: number) => new Date(2026, 8, g, h, 0).toISOString();

// Feedback 27/09: l'agenda deve mostrare per prima cosa cosa c'è da fare.
test("raggruppa per giorno con Oggi e Domani, in ordine", () => {
  const gruppi = prossimiImpegni(
    [evento("dopodomani", iso(30, 9), iso(30, 10)), evento("domani", iso(29, 9), iso(29, 10)), evento("oggi", iso(28, 15), iso(28, 16))],
    adesso
  );
  assert.deepEqual(
    gruppi.map((g) => [g.data, g.eventi.map((e) => e.id)]),
    [
      ["2026-09-28", ["oggi"]],
      ["2026-09-29", ["domani"]],
      ["2026-09-30", ["dopodomani"]],
    ]
  );
  assert.equal(gruppi[0].etichetta, "Oggi");
  assert.equal(gruppi[1].etichetta, "Domani");
});

test("eventi già finiti e oltre la finestra restano fuori", () => {
  const gruppi = prossimiImpegni(
    [evento("finito", iso(28, 8), iso(28, 9)), evento("ieri", iso(27, 9), iso(27, 10)), evento("lontano", iso(5 + 30, 9), iso(5 + 30, 10))],
    adesso
  );
  assert.deepEqual(gruppi, []);
});

test("in corso e su più giorni compaiono sotto Oggi, tutto il giorno per primi", () => {
  const gruppi = prossimiImpegni(
    [
      evento("riunione", iso(28, 9), iso(28, 11)),
      evento("ferie", "2026-09-26T00:00:00+00:00", "2026-09-29T00:00:00+00:00", true),
    ],
    adesso
  );
  assert.equal(gruppi.length, 1);
  assert.deepEqual(gruppi[0].eventi.map((e) => e.id), ["ferie", "riunione"]);
});
