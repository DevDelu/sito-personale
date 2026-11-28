import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const leggi = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("modalità discreta: nei grafici di importi la scala è nascosta", () => {
  assert.match(leggi("app/globals.css"), /\[data-privacy="on"\] \.grafico-importi \.recharts-yAxis-tick-labels\s*\{\s*visibility: hidden;/);
  for (const grafico of [
    "components/spese/DailyTrendChart.tsx",
    "components/spese/CategorySpendingTrendChart.tsx",
    "components/investimenti/PortfolioHistoryChart.tsx",
  ]) {
    assert.match(leggi(grafico), /grafico-importi/, grafico);
  }
});
