import { test } from "node:test";
import assert from "node:assert/strict";
import { etichettaSenzaCifre, percentualeScroll, ruoloElemento, tipoEntita, validaEntita, validaPunto } from "./punto.ts";
import { isAreaFeedback, etichettaArea, etichettaAreaBreve } from "./aree.ts";

test("etichetta senza cifre: niente importi, max 60 caratteri", () => {
  assert.equal(etichettaSenzaCifre("Modifica 12,50 €"), "Modifica ##,## €");
  assert.equal(etichettaSenzaCifre("  Salva\n  movimento  "), "Salva movimento");
  assert.equal(etichettaSenzaCifre("x".repeat(80)).length, 60);
  assert.doesNotMatch(etichettaSenzaCifre("Carta 4111 1111 1111 1111"), /\d/);
});

test("ruolo dell'elemento", () => {
  assert.equal(ruoloElemento({ tag: "BUTTON" }), "bottone");
  assert.equal(ruoloElemento({ tag: "div", role: "button" }), "bottone");
  assert.equal(ruoloElemento({ tag: "A" }), "link");
  assert.equal(ruoloElemento({ tag: "INPUT", type: "text" }), "campo");
  assert.equal(ruoloElemento({ tag: "INPUT", type: "submit" }), "bottone");
  assert.equal(ruoloElemento({ tag: "path", inGrafico: true }), "grafico");
  assert.equal(ruoloElemento({ tag: "TR" }), "riga");
  assert.equal(ruoloElemento({ tag: "div", inCard: true }), "card");
});

test("il punto dal client viene ripulito", () => {
  const p = validaPunto({ ruolo: "bottone", etichetta: "Elimina 34,90", selettore: "button", posizione: { x: 120, y: -3 } });
  assert.deepEqual(p, { ruolo: "bottone", etichetta: "Elimina ##,##", selettore: "button", posizione: { x: 100, y: 0 } });
  assert.equal(validaPunto({ ruolo: "bottone" }), null);
  assert.equal(validaPunto({ ruolo: "inventato", selettore: "a" })?.ruolo, "altro");
});

test("entità: solo tipo:id", () => {
  assert.equal(validaEntita("transazione:3f2a1b4c-1111-2222-3333-444455556666"), "transazione:3f2a1b4c-1111-2222-3333-444455556666");
  assert.equal(validaEntita("asset:IE00B4L5Y983"), "asset:IE00B4L5Y983");
  assert.equal(validaEntita("transazione:12 € pizza"), null);
  assert.equal(validaEntita("<script>:1"), null);
  assert.equal(tipoEntita("carta:42"), "carta");
  assert.equal(tipoEntita(null), null);
});

test("scroll in percentuale", () => {
  assert.equal(percentualeScroll(0, 2000, 800), 0);
  assert.equal(percentualeScroll(600, 2000, 800), 50);
  assert.equal(percentualeScroll(100, 500, 800), 0);
});

test("aree: etichette leggibili", () => {
  assert.equal(isAreaFeedback("spese.gestione.tabella"), true);
  assert.equal(isAreaFeedback("inesistente"), false);
  assert.equal(etichettaArea("spese.gestione.tabella"), "Spese › Gestione › Tabella movimenti");
  assert.equal(etichettaAreaBreve("spese.gestione.tabella"), "Tabella movimenti");
});
