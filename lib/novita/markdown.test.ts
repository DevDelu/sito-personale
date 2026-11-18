import { test } from "node:test";
import assert from "node:assert/strict";
import { hrefSicuro, leggiMarkdown, pezziInline } from "./markdown.ts";

test("blocchi: titoli, paragrafi, elenchi, separatore", () => {
  const b = leggiMarkdown("# Turno\n\nTutto bene\nanche qui.\n\n- uno\n- **due**\n1. primo\n\n---");
  assert.deepEqual(
    b.map((x) => x.tipo),
    ["titolo", "paragrafo", "elenco", "elenco", "separatore"]
  );
  assert.deepEqual(b[1], { tipo: "paragrafo", pezzi: [{ tipo: "testo", testo: "Tutto bene anche qui." }] });
  assert.equal(b[2].tipo === "elenco" && b[2].ordinato, false);
  assert.equal(b[3].tipo === "elenco" && b[3].ordinato, true);
});

test("inline: grassetto, codice, link sicuri", () => {
  assert.deepEqual(pezziInline("Vedi **PR** `#12` su [GitHub](https://github.com/x)"), [
    { tipo: "testo", testo: "Vedi " },
    { tipo: "grassetto", testo: "PR" },
    { tipo: "testo", testo: " " },
    { tipo: "codice", testo: "#12" },
    { tipo: "testo", testo: " su " },
    { tipo: "link", testo: "GitHub", href: "https://github.com/x" },
  ]);
});

test("link pericolosi diventano testo; HTML resta testo", () => {
  assert.deepEqual(pezziInline("[x](javascript:alert(1))"), [
    { tipo: "testo", testo: "x" },
    { tipo: "testo", testo: ")" },
  ]);
  assert.equal(hrefSicuro("//evil.com"), null);
  assert.equal(hrefSicuro("/feedback"), "/feedback");
  assert.deepEqual(leggiMarkdown("<script>alert(1)</script>"), [
    { tipo: "paragrafo", pezzi: [{ tipo: "testo", testo: "<script>alert(1)</script>" }] },
  ]);
});
