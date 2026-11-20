import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { numeroMigration, PRIMA_MIGRATION_CON_GRANT, tabelleSenzaGrant } from "./migration-grant.ts";

test("tabelleSenzaGrant: segnala la tabella senza grant", () => {
  const sql = "create table nuova (id uuid primary key);\nalter table nuova enable row level security;";
  assert.deepEqual(tabelleSenzaGrant(sql), ["nuova"]);
});

test("tabelleSenzaGrant: con grant esplicito passa, anche con schema e if not exists", () => {
  const sql = `create table if not exists public.nuova (id uuid);
grant select, insert, update, delete on public.nuova to service_role;`;
  assert.deepEqual(tabelleSenzaGrant(sql), []);
});

test("tabelleSenzaGrant: un grant solo in un commento non vale", () => {
  const sql = "create table nuova (id uuid);\n-- grant all on nuova to service_role;";
  assert.deepEqual(tabelleSenzaGrant(sql), ["nuova"]);
});

test("numeroMigration legge il prefisso numerico", () => {
  assert.equal(numeroMigration("036_qualcosa.sql"), 36);
  assert.equal(numeroMigration("schema.sql"), null);
});

test(`le migration da ${String(PRIMA_MIGRATION_CON_GRANT).padStart(3, "0")} in poi dichiarano i grant delle tabelle che creano`, () => {
  const dir = join(import.meta.dirname, "../../supabase");
  const problemi: string[] = [];
  for (const f of readdirSync(dir)) {
    const n = numeroMigration(f);
    if (n === null || n < PRIMA_MIGRATION_CON_GRANT) continue;
    const mancanti = tabelleSenzaGrant(readFileSync(join(dir, f), "utf8"));
    if (mancanti.length) problemi.push(`${f}: ${mancanti.join(", ")}`);
  }
  assert.deepEqual(problemi, [], "aggiungi `grant select, insert, update, delete on <tabella> to service_role;`");
});
