import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// RFC 6350: ogni riga di una vCard termina con CRLF; alcune rubriche rifiutano il solo LF.
test("contatto.vcf: righe CRLF, inizio e fine corretti", () => {
  const vcf = readFileSync(new URL("../public/contatto.vcf", import.meta.url), "utf8");
  assert.equal(vcf.replaceAll("\r\n", "").includes("\n"), false);
  assert.ok(vcf.startsWith("BEGIN:VCARD\r\n"));
  assert.ok(vcf.endsWith("END:VCARD\r\n"));
});
