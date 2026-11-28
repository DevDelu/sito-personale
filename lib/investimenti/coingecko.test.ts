import { test } from "node:test";
import assert from "node:assert/strict";
import { leggiPrezziCoinGecko, urlPrezziCoinGecko } from "./coingecko.ts";

test("più cripto stanno in un solo indirizzo", () => {
  const url = new URL(urlPrezziCoinGecko(["bitcoin", "ethereum"], "eur"));
  assert.equal(url.searchParams.get("ids"), "bitcoin,ethereum");
  assert.equal(url.searchParams.get("vs_currencies"), "eur");
});

test("ogni prezzo resta sul suo id; chi manca o non è un numero è escluso", () => {
  const prezzi = leggiPrezziCoinGecko(
    { ethereum: { eur: 20 }, bitcoin: { eur: 100 }, rotta: { eur: "5" } },
    ["bitcoin", "ethereum", "rotta", "assente"],
    "eur",
    "2026-01-02"
  );
  assert.deepEqual([...prezzi], [
    ["bitcoin", { prezzo: 100, data: "2026-01-02" }],
    ["ethereum", { prezzo: 20, data: "2026-01-02" }],
  ]);
  assert.equal(leggiPrezziCoinGecko(null, ["bitcoin"], "eur", "2026-01-02").size, 0);
});
