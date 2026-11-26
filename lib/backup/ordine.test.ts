import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { TABELLE_BACKUP } from "./compone.ts";

const sql = readdirSync("supabase")
  .filter((f) => f.endsWith(".sql"))
  .sort() // le numerate prima, schema.sql in coda: nessuna ricrea le sue tabelle
  .map((f) => readFileSync(`supabase/${f}`, "utf8"))
  .join("\n")
  .replace(/--[^\n]*/g, "");

test("il backup legge le pagine in ordine di id", () => {
  assert.match(readFileSync("app/api/backup/route.ts", "utf8"), /\.order\("id"[^)]*\)\s*\.range\(/);
});

test("ogni tabella del backup ha id come chiave primaria", () => {
  for (const tabella of TABELLE_BACKUP) {
    // Vale l'ultima definizione (my_collection è stata ricreata).
    const creazioni = [...sql.matchAll(new RegExp(`create table (?:if not exists )?${tabella}\\s*\\(([^;]*)`, "gi"))];
    assert.match(creazioni.at(-1)?.[1] ?? "", /^\s*id\s+\w+\s+primary key/im, tabella);
  }
});
