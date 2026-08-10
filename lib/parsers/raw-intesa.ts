import ExcelJS from "exceljs";
import type { ImportRowError } from "@/lib/parsers/import-excel";
import type { RawTransaction } from "@/lib/parsers/raw-crypto";

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
  const text = cellText(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  // Formato Intesa: dd/mm/yyyy
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, d, m, y] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

// Formato italiano: "1.234,56" -> 1234.56. Se il numero è già un tipo
// number (cella formattata come valuta in Excel), passa diretto.
function cellAmount(value: ExcelJS.CellValue): number | null {
  if (typeof value === "number") return value;
  const text = cellText(value).trim();
  if (!text) return null;
  const normalizzato = text.replace(/\./g, "").replace(",", ".");
  const n = Number(normalizzato);
  return Number.isFinite(n) ? n : null;
}

export function parseIntesaRawXlsxWorkbook(
  sheet: ExcelJS.Worksheet
): { righe: RawTransaction[]; errori: ImportRowError[] } {
  const righe: RawTransaction[] = [];
  const errori: ImportRowError[] = [];

  // Il blocco di metadati iniziale ha lunghezza variabile: si scandisce
  // finché non si trova la riga con colonna A == "Data" e B == "Operazione".
  let headerRowNumber = -1;
  for (let r = 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const a = cellText(row.getCell(1).value).trim().toLowerCase();
    const b = cellText(row.getCell(2).value).trim().toLowerCase();
    if (a === "data" && b === "operazione") {
      headerRowNumber = r;
      break;
    }
  }

  if (headerRowNumber === -1) {
    errori.push({ riga: 0, messaggio: 'Riga di intestazione ("Data" | "Operazione") non trovata nel file Intesa.' });
    return { righe, errori };
  }

  // Colonne, in ordine, a partire dalla riga header individuata:
  // Data | Operazione | Dettagli | Conto o carta | Contabilizzazione | Categoria | Valuta | Importo
  const COL = {
    data: 1,
    operazione: 2,
    dettagli: 3,
    categoria: 6,
    importo: 8,
  };

  for (let r = headerRowNumber + 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const dataRaw = row.getCell(COL.data).value;
    const operazione = cellText(row.getCell(COL.operazione).value).trim();
    const dettagli = cellText(row.getCell(COL.dettagli).value).trim();
    const categoriaBanca = cellText(row.getCell(COL.categoria).value).trim();
    const importoRaw = row.getCell(COL.importo).value;

    if (!cellText(dataRaw).trim() && !operazione && !importoRaw) continue; // riga vuota

    const data = cellDate(dataRaw);
    if (!data) {
      errori.push({ riga: r, messaggio: `Data non valida: "${cellText(dataRaw)}".` });
      continue;
    }

    const importo = cellAmount(importoRaw);
    if (importo === null) {
      errori.push({ riga: r, messaggio: `Importo non valido: "${cellText(importoRaw)}".` });
      continue;
    }
    if (importo === 0) continue;

    righe.push({
      data,
      importo: Math.abs(importo),
      tipo: importo < 0 ? "spesa" : "entrata",
      descrizioneGrezza: operazione,
      dettagliGrezzi: dettagli || operazione,
      categoriaBanca: categoriaBanca || null,
      fonte: "intesa",
    });
  }

  return { righe, errori };
}

export async function parseIntesaRawXlsx(
  buffer: ArrayBuffer
): Promise<{ righe: RawTransaction[]; errori: ImportRowError[] }> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    return { righe: [], errori: [{ riga: 0, messaggio: "File Excel Intesa non leggibile o corrotto." }] };
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return { righe: [], errori: [{ riga: 0, messaggio: "Nessun foglio trovato nel file Intesa." }] };
  }

  return parseIntesaRawXlsxWorkbook(sheet);
}
