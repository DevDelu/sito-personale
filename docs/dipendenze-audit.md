# Dipendenze: audit e aggiornamenti

## `npm audit` e exceljs/uuid (GHSA-w5hq-g745-h8pq)

`npm audit --omit=dev` segnala 2 vulnerabilità moderate: `uuid` (dentro `exceljs`). La falla
riguarda solo `uuid` v3/v5/v6 chiamate con un buffer `buf`. `exceljs` usa solo `v4()` senza
argomenti (`lib/xlsx/xform/sheet/cf-ext/cf-rule-ext-xform.js`), quindi non è raggiungibile
dall'import Excel.

**Non usare `npm audit fix --force`**: proporrebbe `exceljs@3.4.0`, un downgrade breaking
(API diverse, import Excel da riscrivere). Da rivalutare solo se esce una versione di
`exceljs` con `uuid` aggiornato.

## Aggiornamenti

Solo minori/patch nel range di `package.json` (`npm update`); i major (FullCalendar 7,
ESLint 10, TypeScript 7, `@types/node` 26, React 19.3, motion 14) restano fuori.
