import { test } from "node:test";
import assert from "node:assert/strict";
import { motiviNonPubblicabile } from "./privacy.mjs";

test("parafrasi pulita passa", () => {
  assert.deepEqual(
    motiviNonPubblicabile("Il filtro per categoria in Gestione non si azzera dopo un salvataggio.", "boh"),
    []
  );
});

test("blocca importi, valute, date, email e numeri lunghi", () => {
  assert.ok(motiviNonPubblicabile("spesa di 42,50 non salvata").includes("importo"));
  assert.ok(motiviNonPubblicabile("pagato 30 euro").includes("valuta"));
  assert.ok(motiviNonPubblicabile("il 12/03 non compare").includes("data"));
  assert.ok(motiviNonPubblicabile("dal 3 marzo non si vede").includes("data"));
  assert.ok(motiviNonPubblicabile("scrivere a mario@example.com").includes("email"));
  assert.ok(motiviNonPubblicabile("IBAN IT60 X054 2811 1010").includes("numero lungo"));
});

test("blocca il testo copiato dall'originale", () => {
  const originale = "quando salvo la spesa dal supermercato sotto casa non compare nella lista";
  assert.ok(
    motiviNonPubblicabile("Lorenzo dice: salvo la spesa dal supermercato sotto casa e sparisce", originale).includes(
      "testo copiato dall'originale"
    )
  );
  assert.deepEqual(motiviNonPubblicabile("Un movimento appena salvato non appare nell'elenco.", originale), []);
});
