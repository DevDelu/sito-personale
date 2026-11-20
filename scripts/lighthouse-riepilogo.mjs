// Legge i report di Lighthouse CI (.lighthouseci/lhr-*.json) e stampa una
// tabella Markdown per il riepilogo del job. Nessun report viene caricato.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2] ?? ".lighthouseci";
const righe = [];
for (const f of readdirSync(dir).filter((n) => /^lhr-.*\.json$/.test(n))) {
  const r = JSON.parse(readFileSync(join(dir, f), "utf8"));
  const p = (k) => Math.round((r.categories[k]?.score ?? 0) * 100);
  const ms = (k) => Math.round(r.audits[k]?.numericValue ?? 0);
  righe.push(
    `| ${new URL(r.finalDisplayedUrl ?? r.finalUrl).pathname} | ${p("performance")} | ${p("accessibility")} | ${p("seo")} | ${ms("largest-contentful-paint")} | ${ms("total-blocking-time")} | ${(r.audits["cumulative-layout-shift"]?.numericValue ?? 0).toFixed(3)} |`
  );
}
console.log("### Lighthouse mobile — pagine pubbliche\n");
console.log("| Pagina | Perf | A11y | SEO | LCP ms | TBT ms | CLS |\n|---|---|---|---|---|---|---|");
console.log(righe.sort().join("\n"));
