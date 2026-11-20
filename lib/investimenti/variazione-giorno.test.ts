import test from "node:test";
import assert from "node:assert/strict";
import { variazioneGiorno, variazioneTotale } from "./variazione-giorno.ts";

const OGGI = "2026-11-16";

test("nessuno storico o un solo prezzo: null", () => {
  assert.equal(variazioneGiorno(null, null, 1, OGGI), null);
  assert.equal(variazioneGiorno({ data: OGGI, prezzo: 10 }, null, 1, OGGI), null);
});

test("calcola importo e percentuale", () => {
  const v = variazioneGiorno({ data: OGGI, prezzo: 110 }, { data: "2026-11-13", prezzo: 100 }, 2, OGGI);
  assert.ok(v);
  assert.equal(v.perUnita, 10);
  assert.equal(v.percentuale, 10);
  assert.equal(v.importo, 20);
});

test("weekend/festivo: l'ultimo prezzo non è di oggi, nessuna riga", () => {
  assert.equal(
    variazioneGiorno({ data: "2026-11-13", prezzo: 100 }, { data: "2026-11-12", prezzo: 99 }, 1, OGGI),
    null,
  );
});

test("precedente non anteriore a oggi o a zero: null", () => {
  assert.equal(variazioneGiorno({ data: OGGI, prezzo: 5 }, { data: OGGI, prezzo: 4 }, 1, OGGI), null);
  assert.equal(variazioneGiorno({ data: OGGI, prezzo: 5 }, { data: "2026-11-13", prezzo: 0 }, 1, OGGI), null);
});

test("variazione negativa", () => {
  const v = variazioneGiorno({ data: OGGI, prezzo: 90 }, { data: "2026-11-13", prezzo: 100 }, 3, OGGI);
  assert.equal(v?.importo, -30);
  assert.equal(v?.percentuale, -10);
});

test("totale: somma solo le posizioni con dato; vuoto = null", () => {
  assert.equal(variazioneTotale([{ variazione: null, valoreAttuale: 100 }]), null);
  const a = { perUnita: 10, percentuale: 10, importo: 20 };
  const t = variazioneTotale([
    { variazione: a, valoreAttuale: 220 },
    { variazione: null, valoreAttuale: 500 },
  ]);
  assert.equal(t?.importo, 20);
  assert.equal(t?.percentuale, 10);
});
