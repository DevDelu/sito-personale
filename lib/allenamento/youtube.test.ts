import { test } from "node:test";
import assert from "node:assert/strict";
import { linkTutorialEsercizio } from "./youtube.ts";

test("il link porta alla ricerca YouTube con il nome dell'esercizio", () => {
  const url = new URL(linkTutorialEsercizio("Panca piana"));
  assert.equal(url.origin + url.pathname, "https://www.youtube.com/results");
  assert.equal(url.searchParams.get("search_query"), "Panca piana esecuzione corretta shorts");
});

test("i caratteri speciali nel nome non rompono la query", () => {
  const url = new URL(linkTutorialEsercizio("Curl & Press #2 (manubri)"));
  assert.equal(url.searchParams.get("search_query"), "Curl & Press #2 (manubri) esecuzione corretta shorts");
  assert.equal(url.hash, "");
});
