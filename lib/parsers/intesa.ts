import ExcelJS from "exceljs";
import { parseData, parseImporto } from "@/lib/csv";
import type { DraftDepositoRow, DraftSpesaRow, ParseResult } from "./types";

const CATEGORIA_DEFAULT = "Altro";

// Bonifici verso te stesso e giroconti sono esclusi a monte (vedi parseIntesaXlsx),
// quindi qui mappiamo solo le categorie bancarie che rappresentano vere entrate/uscite.
// Set ridotto (vedi supabase/003_archivio_redesign.sql): quello che non matcha
// finisce in "Altro", recuperabile poi col badge suggerimento in dashboard.
const CATEGORIA_BANCA_MAP_SPESA: Record<string, string> = {
  "ristoranti e bar": "Ristoranti",
  "generi alimentari e supermercato": "Alimentari",
  carburanti: "Benzina",
};

const CATEGORIA_BANCA_MAP_ENTRATA: Record<string, string> = {
  "stipendi e pensioni": "Stipendio",
  "bonifici ricevuti": "Bonifici",
};

const HEADER_ALIASES: Record<string, string[]> = {
  data: ["data"],
  operazione: ["operazione"],
  dettagli: ["dettagli"],
  contabilizzazione: ["contabilizzazione"],
  categoria: ["categoria"],
  importo: ["importo"],
};

const SELF_TRANSFER_MARKER = "a favore di lorenzo de luca";

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("result" in value) return String(value.result ?? "");
  }
  return String(value).trim();
}

function cellDate(value: ExcelJS.CellValue): string | null {
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const text = cellText(value);
  return text ? parseData(text) : null;
}

function cellAmount(value: ExcelJS.CellValue): number | null {
  if (typeof value === "number") return value;
  const text = cellText(value);
  return text ? parseImporto(text) : null;
}

function mapCategoriaBancaSpesa(categoriaBanca: string): string {
  return CATEGORIA_BANCA_MAP_SPESA[categoriaBanca.trim().toLowerCase()] ?? CATEGORIA_DEFAULT;
}

function mapCategoriaBancaEntrata(categoriaBanca: string): string {
  return CATEGORIA_BANCA_MAP_ENTRATA[categoriaBanca.trim().toLowerCase()] ?? CATEGORIA_DEFAULT;
}

export async function parseIntesaXlsx(buffer: ArrayBuffer): Promise<ParseResult> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    return { ok: false, error: "File Excel non leggibile o corrotto." };
  }

  const sheet =
    workbook.worksheets.find((s) => s.name.toLowerCase().includes("lista operazion")) ??
    workbook.worksheets[0];

  if (!sheet) {
    return { ok: false, error: "Nessun foglio trovato nel file Excel." };
  }

  // L'header non è sempre alla stessa riga fissa (dipende da quanti metadati
  // il conto stampa in testa), quindi lo cerchiamo invece di assumere riga 19.
  let headerRowNumber = -1;
  let colIndex: Record<keyof typeof HEADER_ALIASES, number> | null = null;

  for (let r = 1; r <= Math.min(sheet.rowCount, 40); r++) {
    const row = sheet.getRow(r);
    const texts = new Map<string, number>();
    row.eachCell((cell, colNumber) => {
      texts.set(cellText(cell.value).trim().toLowerCase(), colNumber);
    });

    if (texts.has("operazione") && texts.has("importo")) {
      const found: Partial<Record<keyof typeof HEADER_ALIASES, number>> = {};
      for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [
        keyof typeof HEADER_ALIASES,
        string[],
      ][]) {
        for (const alias of aliases) {
          if (texts.has(alias)) {
            found[field] = texts.get(alias);
            break;
          }
        }
      }
      if (found.data && found.operazione && found.importo) {
        headerRowNumber = r;
        colIndex = found as Record<keyof typeof HEADER_ALIASES, number>;
      }
      break;
    }
  }

  if (headerRowNumber === -1 || !colIndex) {
    return {
      ok: false,
      error:
        "Struttura del file Excel non riconosciuta: non trovo una riga con le colonne 'Data', 'Operazione' e 'Importo'.",
    };
  }

  const spese: DraftSpesaRow[] = [];
  const depositi: DraftDepositoRow[] = [];
  const skippedInvalidRows: number[] = [];
  let skippedIgnored = 0;

  for (let r = headerRowNumber + 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const operazione = cellText(row.getCell(colIndex.operazione)).trim();
    const importoRaw = row.getCell(colIndex.importo).value;

    if (!operazione && (importoRaw === null || importoRaw === undefined)) continue; // riga vuota

    const dettagli = colIndex.dettagli
      ? cellText(row.getCell(colIndex.dettagli)).trim() || null
      : null;
    const contabilizzazione = colIndex.contabilizzazione
      ? cellText(row.getCell(colIndex.contabilizzazione)).trim().toLowerCase()
      : "si";
    const categoriaBanca = colIndex.categoria
      ? cellText(row.getCell(colIndex.categoria)).trim()
      : "";

    if (contabilizzazione && contabilizzazione !== "si") {
      skippedIgnored++;
      continue;
    }

    if (operazione.toLowerCase().includes(SELF_TRANSFER_MARKER)) {
      skippedIgnored++;
      continue;
    }

    if (/^girocont/i.test(categoriaBanca)) {
      skippedIgnored++;
      continue;
    }

    const importo = cellAmount(importoRaw);
    const data = cellDate(row.getCell(colIndex.data).value);

    if (importo === null || importo === 0 || data === null || !operazione) {
      skippedInvalidRows.push(r);
      continue;
    }

    if (importo > 0) {
      depositi.push({
        importo,
        titolo: operazione,
        descrizione: dettagli,
        categoriaNome: categoriaBanca
          ? mapCategoriaBancaEntrata(categoriaBanca)
          : CATEGORIA_DEFAULT,
        categoria_banca: categoriaBanca || null,
        data,
        fonte: "intesa",
      });
    } else {
      spese.push({
        importo: Math.abs(importo),
        titolo: operazione,
        descrizione: dettagli,
        categoriaNome: categoriaBanca ? mapCategoriaBancaSpesa(categoriaBanca) : CATEGORIA_DEFAULT,
        categoria_banca: categoriaBanca || null,
        data,
        fonte: "intesa",
      });
    }
  }

  return { ok: true, spese, depositi, skippedIgnored, skippedInvalidRows };
}
