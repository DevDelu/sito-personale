import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Regola di CLAUDE.md: nessun testo sotto i 12px nell'area privata, tranne le
// etichette della tab bar. Le eccezioni sono elencate qui, esplicite.
const ECCEZIONI = new Set([
  "components/shell/QuickAddButton.tsx", // etichetta della tab bar
  "components/shell/TabBar.tsx", // etichette della tab bar (11px)
  "components/sidebar.tsx", // solo desktop
  "components/feedback/FeedbackAccessi.tsx", // solo desktop (tasto F)
]);

function file(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) return file(p);
    return /\.tsx$/.test(p) ? [p] : [];
  });
}

// Anche i grafici Recharts: fontSize numerico sotto 12 (es. fontSize: 11).
const PICCOLO = /text-\[(9|10|11)px\]|fontSize:\s*(9|10|11)\b/;

test("nessun testo sotto i 12px fuori dalle eccezioni", () => {
  const trovati = ["app", "components"]
    .flatMap(file)
    .filter((p) => !ECCEZIONI.has(p))
    .filter((p) => PICCOLO.test(readFileSync(p, "utf8")));
  assert.deepEqual(trovati, []);
});
