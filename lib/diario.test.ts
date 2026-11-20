import test from "node:test";
import assert from "node:assert/strict";
import { filtraPr, lunediDellaSettimana, raggruppaPerSettimana } from "./diario.ts";

const pr = (number: number, title: string, merged_at: string | null) => ({
  number,
  title,
  merged_at,
  html_url: `https://github.com/x/y/pull/${number}`,
});

test("lunediDellaSettimana: domenica e lunedì", () => {
  assert.equal(lunediDellaSettimana("2026-11-15T23:00:00Z"), "2026-11-09");
  assert.equal(lunediDellaSettimana("2026-11-16T00:10:00Z"), "2026-11-16");
});

test("filtraPr: solo mergiate, niente dipendenze o revert, dalla più recente", () => {
  const r = filtraPr([
    pr(1, "Spese: filtro", "2026-11-10T10:00:00Z"),
    pr(2, "Chiusa senza merge", null),
    pr(3, "Build(deps): Bump x from 1 to 2", "2026-11-11T10:00:00Z"),
    pr(4, "Revert #1", "2026-11-12T10:00:00Z"),
    pr(5, "Carte: podio", "2026-11-13T10:00:00Z"),
  ]);
  assert.deepEqual(r.map((p) => p.numero), [5, 1]);
});

test("filtraPr: rispetta il massimo", () => {
  const molte = Array.from({ length: 5 }, (_, i) => pr(i, `T${i}`, `2026-11-1${i}T10:00:00Z`));
  assert.equal(filtraPr(molte, 2).length, 2);
});

test("raggruppaPerSettimana: gruppi dal più recente, ordine interno mantenuto", () => {
  const prs = filtraPr([
    pr(1, "A", "2026-11-03T10:00:00Z"),
    pr(2, "B", "2026-11-10T10:00:00Z"),
    pr(3, "C", "2026-11-12T10:00:00Z"),
  ]);
  const g = raggruppaPerSettimana(prs);
  assert.deepEqual(g.map((s) => s.inizio), ["2026-11-09", "2026-11-02"]);
  assert.deepEqual(g[0].prs.map((p) => p.numero), [3, 2]);
});
