import { test } from "node:test";
import assert from "node:assert/strict";
import { componiEmailContatto } from "./email.ts";

test("il testo del visitatore resta testo nell'email", () => {
  const { html } = componiEmailContatto('<b>Ada</b>', "a@example.org", 'Ciao <a href="https://example.org">qui</a>\r\n& saluti');
  assert.doesNotMatch(html, /<a |<b>/);
  assert.match(html, /&lt;b&gt;Ada&lt;\/b&gt;/);
  assert.match(html, /<br \/>&amp; saluti/);
});

test("l'oggetto sta su una riga sola", () => {
  assert.equal(componiEmailContatto("Ada\r\nLovelace", "a@example.org", "x").subject, "Nuovo messaggio dal sito — Ada Lovelace");
});
