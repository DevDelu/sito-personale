import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const leggi = (file: string) => readFileSync(new URL(`../../${file}`, import.meta.url), "utf8");

function elenco(sorgente: string, nome: string): string[] {
  const blocco = sorgente.match(new RegExp(`${nome} = \\[([\\s\\S]*?)\\];`));
  assert.ok(blocco, `elenco ${nome} non trovato`);
  return [...blocco[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

test("API e ogni prefisso privato hanno una voce dedicata nel matcher del proxy", () => {
  const radice = leggi("proxy.ts");
  const matcher = radice.slice(radice.indexOf("matcher:"));
  const prefissi = new Set([
    "/api",
    ...elenco(radice, "UNLOCALIZED_PREFIXES"),
    ...elenco(leggi("lib/supabase/proxy.ts"), "PROTECTED_PREFIXES"),
  ]);
  for (const prefisso of prefissi) {
    assert.ok(matcher.includes(`"${prefisso}/:path*"`), `manca "${prefisso}/:path*" nel matcher`);
  }
});

test("l'identità dell'utente si legge solo dalla sessione", () => {
  assert.doesNotMatch(leggi("lib/supabase/dal.ts"), /next\/headers/);
});
