import { test } from "node:test";
import assert from "node:assert/strict";
import { isUuid, validaFeedback } from "./validazione.ts";
import { FEEDBACK_TESTO_MAX } from "./types.ts";

const base = { testo: "  Il pulsante non risponde  ", tipo: "problema", origine: "pulsante", route: "/spese" };

test("isUuid accetta solo UUID", () => {
  assert.equal(isUuid("123e4567-e89b-12d3-a456-426614174000"), true);
  assert.equal(isUuid("non-un-uuid"), false);
  assert.equal(isUuid(42), false);
});

test("un feedback valido viene ripulito e completato con i default", () => {
  const r = validaFeedback(base);
  assert.ok(r);
  assert.equal(r.testo, "Il pulsante non risponde");
  assert.equal(r.url, null);
  assert.equal(r.nota_per, null);
  assert.equal(r.contesto.viewport, "mobile");
  assert.equal(r.contesto.tema, "chiaro");
});

test("body non valido, testo vuoto o troppo lungo, tipo/origine sconosciuti → null", () => {
  assert.equal(validaFeedback(null), null);
  assert.equal(validaFeedback("ciao"), null);
  assert.equal(validaFeedback({ ...base, testo: "   " }), null);
  assert.equal(validaFeedback({ ...base, testo: "a".repeat(FEEDBACK_TESTO_MAX + 1) }), null);
  assert.ok(validaFeedback({ ...base, testo: "a".repeat(FEEDBACK_TESTO_MAX) }));
  assert.equal(validaFeedback({ ...base, tipo: "boh" }), null);
  assert.equal(validaFeedback({ ...base, origine: "boh" }), null);
});

test("url: solo path dell'app, mai URL esterni", () => {
  assert.equal(validaFeedback({ ...base, url: "/spese?mese=2" })?.url, "/spese?mese=2");
  assert.equal(validaFeedback({ ...base, url: "https://evil.example/x" })?.url, null);
  assert.equal(validaFeedback({ ...base, url: "//evil.example/x" })?.url, null);
});

test("la vecchia chiave `pagina` vale come route; l'area sconosciuta o feedback.sheet è scartata", () => {
  const r = validaFeedback({ testo: "x", tipo: "idea", origine: "tab", pagina: "/carte" });
  assert.equal(r?.route, "/carte");
  assert.equal(validaFeedback({ ...base, area: "inventata.area" })?.area, null);
  assert.equal(validaFeedback({ ...base, area: "feedback.sheet" })?.area, null);
});

test("nota_per accetta solo UUID", () => {
  assert.equal(validaFeedback({ ...base, nota_per: "123e4567-e89b-12d3-a456-426614174000" })?.nota_per, "123e4567-e89b-12d3-a456-426614174000");
  assert.equal(validaFeedback({ ...base, nota_per: "abc" })?.nota_per, null);
});

test("contesto: scroll limitato a 0-100, chiavi e attriti ridotti", () => {
  const r = validaFeedback({
    ...base,
    contesto: {
      scroll_y: 250.4,
      viewport: "desktop",
      tema: "scuro",
      query_chiavi: [...Array(30).fill("k".repeat(80)), 7],
      attriti_recenti: [...Array(15).fill({ tipo: "rage_click", pagina: "/spese", at: "t" }), { tipo: "x" }],
    },
  });
  assert.ok(r);
  assert.equal(r.contesto.scroll_y, 100);
  assert.equal(r.contesto.viewport, "desktop");
  assert.equal(r.contesto.tema, "scuro");
  assert.equal(r.contesto.query_chiavi.length, 20);
  assert.equal(r.contesto.query_chiavi[0].length, 40);
  assert.ok((r.contesto.attriti_recenti ?? []).length <= 10);
});
