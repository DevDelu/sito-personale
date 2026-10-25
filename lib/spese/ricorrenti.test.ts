import { test } from "node:test";
import assert from "node:assert/strict";
import { aggiungiMesi, normalizzaTitolo, totaleAnnuo, trovaRicorrenti, type SpesaGrezza } from "./ricorrenti.ts";

function s(titolo: string, importo: number, data: string): SpesaGrezza {
  return { titolo, importo, data };
}

const OGGI = "2026-06-20";

test("normalizza minuscole, cifre e spazi", () => {
  assert.equal(normalizzaTitolo("  Streaming   Demo 123 "), "streaming demo");
});

test("mensile regolare", () => {
  const r = trovaRicorrenti(
    [s("Streaming Demo", 9.99, "2026-03-05"), s("Streaming Demo", 9.99, "2026-04-05"), s("Streaming Demo", 9.99, "2026-05-05"), s("Streaming Demo", 9.99, "2026-06-05")],
    OGGI
  );
  assert.equal(r.length, 1);
  assert.equal(r[0].cadenza, "mensile");
  assert.equal(r[0].importoTipico, 9.99);
  assert.equal(r[0].ultimaData, "2026-06-05");
  assert.equal(r[0].prossimaData, "2026-07-05");
  assert.equal(r[0].costoAnnuo, 119.88);
  assert.equal(r[0].importoAumentato, false);
  assert.equal(totaleAnnuo(r), 119.88);
});

test("mensile con un mese saltato resta ricorrente", () => {
  const r = trovaRicorrenti(
    [s("Palestra Demo", 30, "2026-01-10"), s("Palestra Demo", 30, "2026-02-10"), s("Palestra Demo", 30, "2026-04-10"), s("Palestra Demo", 30, "2026-05-10")],
    OGGI
  );
  assert.equal(r.length, 1);
  assert.equal(r[0].cadenza, "mensile");
  assert.equal(r[0].prossimaData, "2026-06-10");
});

test("importo variabile escluso", () => {
  const r = trovaRicorrenti(
    [s("Bolletta Demo", 40, "2026-03-01"), s("Bolletta Demo", 85, "2026-04-01"), s("Bolletta Demo", 20, "2026-05-01"), s("Bolletta Demo", 60, "2026-06-01")],
    OGGI
  );
  assert.equal(r.length, 0);
});

test("spesa ripetuta ma irregolare esclusa", () => {
  const r = trovaRicorrenti(
    [s("Caffe Demo", 1.2, "2026-05-01"), s("Caffe Demo", 1.2, "2026-05-04"), s("Caffe Demo", 1.2, "2026-05-23"), s("Caffe Demo", 1.2, "2026-06-12")],
    OGGI
  );
  assert.equal(r.length, 0);
});

test("aumento di prezzo segnalato", () => {
  const r = trovaRicorrenti(
    [s("Cloud Demo", 2.99, "2026-03-15"), s("Cloud Demo", 2.99, "2026-04-15"), s("Cloud Demo", 2.99, "2026-05-15"), s("Cloud Demo", 3.99, "2026-06-15")],
    OGGI
  );
  assert.equal(r.length, 1);
  assert.equal(r[0].importoAumentato, true);
  assert.equal(r[0].importoTipico, 3.99);
  assert.equal(r[0].costoAnnuo, 47.88);
});

test("settimanale e annuale", () => {
  const sett = trovaRicorrenti(
    [s("Abbonamento A", 5, "2026-06-01"), s("Abbonamento A", 5, "2026-06-08"), s("Abbonamento A", 5, "2026-06-15")],
    OGGI
  );
  assert.equal(sett[0].cadenza, "settimanale");
  assert.equal(sett[0].prossimaData, "2026-06-22");
  assert.equal(sett[0].costoAnnuo, 260);

  const ann = trovaRicorrenti(
    [s("Dominio Demo", 12, "2024-06-25"), s("Dominio Demo", 12, "2025-06-25"), s("Dominio Demo", 12, "2026-06-25")],
    "2026-07-01"
  );
  assert.equal(ann[0].cadenza, "annuale");
  assert.equal(ann[0].prossimaData, "2027-06-25");
});

test("meno di 3 occorrenze, titoli vuoti e importi non positivi ignorati", () => {
  const r = trovaRicorrenti(
    [s("Solo Due", 5, "2026-05-01"), s("Solo Due", 5, "2026-06-01"), { titolo: null, importo: 5, data: "2026-04-01" }, s("Rimborso", -5, "2026-04-01")],
    OGGI
  );
  assert.equal(r.length, 0);
});

test("ricorrenza terminata da tempo esclusa", () => {
  const r = trovaRicorrenti(
    [s("Vecchio Demo", 8, "2026-01-05"), s("Vecchio Demo", 8, "2026-02-05"), s("Vecchio Demo", 8, "2026-03-05")],
    OGGI
  );
  assert.equal(r.length, 0);
});

test("fine mese: la data attesa si riduce al mese più corto", () => {
  const r = trovaRicorrenti(
    [s("Rata Demo", 100, "2026-01-31"), s("Rata Demo", 100, "2026-02-28"), s("Rata Demo", 100, "2026-03-31"), s("Rata Demo", 100, "2026-04-30")],
    "2026-05-20"
  );
  assert.equal(r.length, 1);
  assert.equal(r[0].prossimaData, "2026-05-30");
});

test("cifre nel titolo non separano il gruppo", () => {
  const r = trovaRicorrenti(
    [s("Servizio 0412", 7, "2026-04-02"), s("Servizio 0512", 7, "2026-05-02"), s("Servizio 0612", 7, "2026-06-02")],
    OGGI
  );
  assert.equal(r.length, 1);
});

test("finestra di 25 mesi: l'annuale con 3 addebiti rientra, mesi negativi e fine mese", () => {
  assert.equal(aggiungiMesi("2026-06-20", -25), "2024-05-20");
  assert.equal(aggiungiMesi("2026-03-31", -13), "2025-02-28");
});
