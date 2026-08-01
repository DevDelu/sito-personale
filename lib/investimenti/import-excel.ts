import ExcelJS from "exceljs";
import type { CostoTipo, TipoTransazione } from "./types";

export type ImportRowInvestimenti = {
  ticker: string;
  tipo: TipoTransazione;
  quantita: number;
  prezzo_unitario: number | null;
  data: string;
  costo_tipo: CostoTipo;
  note: string | null;
};

export type ImportRowError = { riga: number; messaggio: string };

export type ImportResultInvestimenti =
  | { ok: true; righeValide: ImportRowInvestimenti[]; errori: ImportRowError[] }
  | { ok: false; error: string };

const COLONNE = ["ticker", "tipo", "quantita", "prezzo_unitario", "data", "costo_tipo", "note"] as const;
const TIPI_AMMESSI = new Set(["buy", "sell"]);
const COSTO_TIPI_AMMESSI = new Set(["verificato", "stimato", "sconosciuto"]);

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
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function cellNumber(value: ExcelJS.CellValue): number | null {
  if (typeof value === "number") return value;
  const text = cellText(value).trim().replace(",", ".");
  const n = Number(text);
  return text && Number.isFinite(n) ? n : null;
}

export async function parseImportExcelInvestimenti(buffer: ArrayBuffer): Promise<ImportResultInvestimenti> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    return { ok: false, error: "File Excel non leggibile o corrotto." };
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) return { ok: false, error: "Nessun foglio trovato nel file." };

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber] = cellText(cell.value).trim().toLowerCase();
  });

  const colIndex: Partial<Record<(typeof COLONNE)[number], number>> = {};
  for (const nome of COLONNE) {
    const idx = headers.findIndex((h) => h === nome);
    if (idx !== -1) colIndex[nome] = idx;
  }

  const mancanti = COLONNE.filter((c) => c !== "note" && colIndex[c] === undefined);
  if (mancanti.length > 0) {
    return {
      ok: false,
      error: `Colonne mancanti nel file: ${mancanti.join(", ")}. Le colonne attese sono: ${COLONNE.join(", ")}.`,
    };
  }

  const righeValide: ImportRowInvestimenti[] = [];
  const errori: ImportRowError[] = [];

  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const get = (col: (typeof COLONNE)[number]) => {
      const idx = colIndex[col];
      return idx === undefined ? null : row.getCell(idx).value;
    };

    const ticker = cellText(get("ticker")).trim().toUpperCase();
    const tipoRaw = cellText(get("tipo")).trim().toLowerCase();
    const quantitaRaw = get("quantita");
    const dataRaw = get("data");

    if (!ticker && !tipoRaw && !quantitaRaw && !dataRaw) continue; // riga vuota

    if (!ticker) {
      errori.push({ riga: r, messaggio: "ticker mancante." });
      continue;
    }
    if (!TIPI_AMMESSI.has(tipoRaw)) {
      errori.push({ riga: r, messaggio: `tipo non valido: "${tipoRaw}" (atteso "buy" o "sell").` });
      continue;
    }
    const quantita = cellNumber(quantitaRaw);
    if (quantita === null || quantita <= 0) {
      errori.push({ riga: r, messaggio: "quantita non valida (atteso un numero positivo)." });
      continue;
    }
    const data = cellDate(dataRaw);
    if (!data) {
      errori.push({ riga: r, messaggio: "data non valida (atteso formato YYYY-MM-DD)." });
      continue;
    }
    const prezzoRaw = get("prezzo_unitario");
    const prezzoText = cellText(prezzoRaw).trim();
    const prezzo_unitario = prezzoText ? cellNumber(prezzoRaw) : null;
    if (prezzoText && prezzo_unitario === null) {
      errori.push({ riga: r, messaggio: "prezzo_unitario non valido." });
      continue;
    }

    const costoTipoRaw = cellText(get("costo_tipo")).trim().toLowerCase();
    const costo_tipo = (costoTipoRaw || "verificato") as CostoTipo;
    if (!COSTO_TIPI_AMMESSI.has(costo_tipo)) {
      errori.push({
        riga: r,
        messaggio: `costo_tipo non valido: "${costoTipoRaw}" (atteso verificato/stimato/sconosciuto).`,
      });
      continue;
    }

    righeValide.push({
      ticker,
      tipo: tipoRaw as TipoTransazione,
      quantita,
      prezzo_unitario,
      data,
      costo_tipo,
      note: cellText(get("note")).trim() || null,
    });
  }

  return { ok: true, righeValide, errori };
}
