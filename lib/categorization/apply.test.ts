import { test } from "node:test";
import assert from "node:assert/strict";
import { applicaCategorizzazione } from "./apply.ts";
import { PROPRIO_NOMINATIVO } from "./rules.ts";

type Raw = Parameters<typeof applicaCategorizzazione>[0][number];

const raw = (o: Partial<Raw>): Raw => ({
  data: "2026-01-10",
  importo: 12.5,
  tipo: "spesa",
  descrizioneGrezza: "",
  dettagliGrezzi: "",
  categoriaBanca: null,
  fonte: "intesa",
  ...o,
});

test("i giroconti Crypto.com (EUR deposit/withdrawal) sono esclusi, non inseriti", () => {
  const r = applicaCategorizzazione([raw({ fonte: "crypto", descrizioneGrezza: "EUR Deposit" })]);
  assert.equal(r.categorizzate.length, 0);
  assert.deepEqual(r.escluse.map((e) => e.motivoRegolaId), ["crypto-deposit-withdrawal"]);
});

test("il bonifico verso sé stesso è escluso", () => {
  const r = applicaCategorizzazione([
    raw({
      descrizioneGrezza: "Bonifico",
      dettagliGrezzi: `Da voi disposto a favore di ${PROPRIO_NOMINATIVO}`,
    }),
  ]);
  assert.equal(r.categorizzate.length, 0);
  assert.equal(r.escluse[0].motivoRegolaId, "intesa-bonifico-self");
});

test("supermercati e benzina sono categorizzati e non da verificare", () => {
  const r = applicaCategorizzazione([
    raw({ descrizioneGrezza: "Conad City" }),
    raw({ descrizioneGrezza: "Eni1234" }),
  ]);
  assert.deepEqual(r.categorizzate.map((c) => c.categoria), ["Alimentari", "Benzina"]);
  assert.ok(r.categorizzate.every((c) => !c.daVerificare && c.categoriaSuggerita === null));
});

test("senza regola specifica → Altro, da verificare, con la categoria della banca come suggerimento", () => {
  const r = applicaCategorizzazione([raw({ descrizioneGrezza: "Negozio sconosciuto", categoriaBanca: "Shopping" })]);
  assert.equal(r.categorizzate[0].categoria, "Altro");
  assert.equal(r.categorizzate[0].daVerificare, true);
  assert.equal(r.categorizzate[0].categoriaSuggerita, "Shopping");
});

test("bonifico in uscita: il nominativo è il beneficiario; in entrata è il mittente", () => {
  const r = applicaCategorizzazione([
    raw({ descrizioneGrezza: "Bonifico", dettagliGrezzi: "Da voi disposto a favore di Mario Rossi, causale affitto" }),
    raw({ tipo: "entrata", descrizioneGrezza: "Bonifico", dettagliGrezzi: "Disposto da Anna Bianchi, causale cena" }),
  ]);
  assert.equal(r.categorizzate[0].categoria, "Bonifici");
  assert.equal(r.categorizzate[0].nominativo, "Mario Rossi");
  assert.equal(r.categorizzate[1].nominativo, "Anna Bianchi");
});

test("lo stipendio ha categoria Stipendio e importo/data restano quelli della riga", () => {
  const r = applicaCategorizzazione([
    raw({ tipo: "entrata", importo: 1500, descrizioneGrezza: "Accredito Stipendio", categoriaBanca: "Stipendi" }),
  ]);
  assert.equal(r.categorizzate[0].categoria, "Stipendio");
  assert.equal(r.categorizzate[0].importo, 1500);
  assert.equal(r.categorizzate[0].data, "2026-01-10");
});
