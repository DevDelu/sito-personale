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

test("Trade Republic: il bonifico da un mio conto è un giroconto, anche con il nome in ordine COGNOME NOME", () => {
  const nomeInvertito = PROPRIO_NOMINATIVO.split(" ").reverse().join(" ").toUpperCase();
  const r = applicaCategorizzazione([
    raw({
      fonte: "traderepublic",
      tipo: "entrata",
      tipoBanca: "Bonifico",
      descrizioneGrezza: `Incoming transfer from ${nomeInvertito} (IT00X0000000000000000000000)`,
    }),
  ]);
  assert.equal(r.categorizzate.length, 0);
  assert.equal(r.escluse[0].motivoRegolaId, "traderepublic-bonifico-self");
});

test("Trade Republic: piani di accumulo e ordini sono esclusi come investimenti", () => {
  const r = applicaCategorizzazione([
    raw({ fonte: "traderepublic", tipoBanca: "Commercio", descrizioneGrezza: "Savings plan execution IE0000000000" }),
  ]);
  assert.equal(r.categorizzate.length, 0);
  assert.equal(r.escluse[0].motivoRegolaId, "traderepublic-investimento");
});

test("Trade Republic: un bonifico da terzi va in Bonifici con il nominativo", () => {
  const r = applicaCategorizzazione([
    raw({
      fonte: "traderepublic",
      tipo: "entrata",
      tipoBanca: "Bonifico",
      descrizioneGrezza: "Incoming transfer from MARIO ROSSI (IT00X0000000000000000000000)",
    }),
  ]);
  assert.equal(r.categorizzate[0].categoria, "Bonifici");
  assert.equal(r.categorizzate[0].nominativo, "MARIO ROSSI");
  assert.equal(r.categorizzate[0].titolo, "Bonifico da MARIO ROSSI");
});

test("Trade Republic: le spese con carta passano dalle regole comuni (PayPal)", () => {
  const r = applicaCategorizzazione([
    raw({ fonte: "traderepublic", tipoBanca: "Transazione con carta", descrizioneGrezza: "PAYPAL *ESEMPIO" }),
  ]);
  assert.equal(r.categorizzate[0].categoria, "PayPal");
});
