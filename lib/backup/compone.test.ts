import { test } from "node:test";
import assert from "node:assert/strict";
import { componiBackup, nomeFileBackup, TABELLE_BACKUP, TABELLE_ESCLUSE } from "./compone.ts";

const ADESSO = new Date("2026-11-12T03:00:00Z");

test("nessuna tabella esclusa è tra quelle incluse", () => {
  for (const t of TABELLE_ESCLUSE) assert.ok(!(TABELLE_BACKUP as readonly string[]).includes(t), t);
});

test("le tabelle con credenziali non entrano mai, anche se passate", () => {
  const b = componiBackup(
    [
      { tabella: "spese", righe: [{ id: 1 }] },
      { tabella: "integrazione_google", righe: [{ refresh_token: "x" }] },
      { tabella: "push_subscriptions", righe: [{ endpoint: "y" }] },
    ],
    ADESSO
  );
  assert.deepEqual(Object.keys(b.tabelle), ["spese"]);
  assert.equal(JSON.stringify(b).includes("refresh_token"), false);
});

test("una tabella in errore va in non_disponibili senza far fallire il resto", () => {
  const b = componiBackup(
    [
      { tabella: "spese", righe: [] },
      { tabella: "pasti", righe: null, errore: "relation does not exist" },
    ],
    ADESSO
  );
  assert.deepEqual(b.tabelle, { spese: [] });
  assert.equal(b.non_disponibili.pasti, "relation does not exist");
});

test("nome file con la data", () => {
  assert.equal(nomeFileBackup(ADESSO), "radar-backup-2026-11-12.json");
});
