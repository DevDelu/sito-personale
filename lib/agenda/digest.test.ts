import { test } from "node:test";
import assert from "node:assert/strict";
import { componiPushAgenda, eventiDiOggi } from "./digest.ts";
import type { Evento } from "./types.ts";

function ev(parziale: Partial<Evento>): Evento {
  return {
    id: "x",
    titolo: "Evento",
    descrizione: null,
    luogo: null,
    data_inizio: "2026-10-27T09:00:00+01:00",
    data_fine: "2026-10-27T10:00:00+01:00",
    tutto_il_giorno: false,
    categoria: "altro",
    colore: null,
    google_event_id: null,
    source: "manuale",
    sync_status: "synced",
    created_at: "",
    updated_at: "",
    ...parziale,
  };
}

test("nessun evento e nessuna nota: nessun push", () => {
  assert.equal(componiPushAgenda([], "2026-10-27", false), null);
});

test("solo nota: lo dice", () => {
  assert.match(componiPushAgenda([], "2026-10-27", true)?.body ?? "", /nota/);
});

test("un evento con orario (fuso di Roma)", () => {
  const r = componiPushAgenda([ev({ titolo: "Dentista" })], "2026-10-27", false);
  assert.equal(r?.body, "Oggi hai 1 evento. Dentista, alle 09:00.");
});

test("più eventi: conta e primo per orario, con nota", () => {
  const eventi = [
    ev({ titolo: "Cena", data_inizio: "2026-10-27T20:00:00+01:00", data_fine: "2026-10-27T22:00:00+01:00" }),
    ev({ titolo: "Call", data_inizio: "2026-10-27T10:30:00+01:00", data_fine: "2026-10-27T11:00:00+01:00" }),
  ];
  assert.equal(
    componiPushAgenda(eventi, "2026-10-27", true)?.body,
    "Oggi hai 2 eventi. Il primo: Call, alle 10:30. C'è anche la nota del giorno."
  );
});

test("giornata intera prima degli altri, e fine inclusiva", () => {
  const eventi = [
    ev({ titolo: "Ferie", tutto_il_giorno: true, data_inizio: "2026-10-26", data_fine: "2026-10-27" }),
    ev({ titolo: "Call" }),
  ];
  assert.equal(eventiDiOggi(eventi, "2026-10-27")[0].titolo, "Ferie");
  assert.match(componiPushAgenda(eventi, "2026-10-27", false)?.body ?? "", /tutto il giorno/);
});

test("eventi di altri giorni esclusi", () => {
  assert.equal(componiPushAgenda([ev({ data_inizio: "2026-10-28T09:00:00+01:00", data_fine: "2026-10-28T10:00:00+01:00" })], "2026-10-27", false), null);
});

test("evento che finisce a mezzanotte in punto: non è un impegno del giorno dopo", () => {
  const cena = ev({ data_inizio: "2026-10-26T22:00:00+01:00", data_fine: "2026-10-27T00:00:00+01:00" });
  assert.equal(eventiDiOggi([cena], "2026-10-27").length, 0);
  assert.equal(eventiDiOggi([cena], "2026-10-26").length, 1);
});

test("evento senza durata a mezzanotte: resta nel suo giorno", () => {
  const istante = ev({ data_inizio: "2026-10-27T00:00:00+01:00", data_fine: "2026-10-27T00:00:00+01:00" });
  assert.equal(eventiDiOggi([istante], "2026-10-27").length, 1);
});
