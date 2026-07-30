import ExcelJS from "exceljs";

export type ImportRow = {
  tipo: "spesa" | "entrata";
  data: string;
  importo: number;
  categoria: string;
  titolo: string;
  descrizione: string | null;
  nominativo: string | null;
  dettaglio: string | null;
  fonte: "crypto" | "intesa";
};

export type ImportRowError = { riga: number; messaggio: string };

export type ImportResult =
  | { ok: true; righeValide: ImportRow[]; errori: ImportRowError[] }
  | { ok: false; error: string };

const COLONNE = [
  "tipo",
  "data",
  "importo",
  "categoria",
  "titolo",
  "descrizione",
  "nominativo",
  "dettaglio",
  "fonte",
] as const;

const CATEGORIE_SPESA = new Set([
  "Alimentari",
  "Benzina",
  "Vinted",
  "PayPal",
  "Bonifici",
  "Ristoranti",
  "Altro",
]);
const CATEGORIE_ENTRATA = new Set(["Stipendio", "Rimborso", "Vinted", "Bonifici", "Altro"]);
const FONTI_AMMESSE = new Set(["crypto", "intesa"]);

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

function cellAmount(value: ExcelJS.CellValue): number | null {
  if (typeof value === "number") return value;
  const text = cellText(value).trim().replace(",", ".");
  const n = Number(text);
  return text && Number.isFinite(n) ? n : null;
}

export async function parseImportExcel(buffer: ArrayBuffer): Promise<ImportResult> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    return { ok: false, error: "File Excel non leggibile o corrotto." };
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return { ok: false, error: "Nessun foglio trovato nel file." };
  }

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

  const mancanti = COLONNE.filter((c) => colIndex[c] === undefined);
  if (mancanti.length > 0) {
    return {
      ok: false,
      error: `Colonne mancanti nel file: ${mancanti.join(", ")}. Le colonne attese sono: ${COLONNE.join(", ")}.`,
    };
  }

  const righeValide: ImportRow[] = [];
  const errori: ImportRowError[] = [];

  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const get = (col: (typeof COLONNE)[number]) => row.getCell(colIndex[col]!).value;

    const tipoRaw = cellText(get("tipo")).toLowerCase();
    const titolo = cellText(get("titolo")).trim();
    const dataRaw = get("data");
    const importoRaw = get("importo");
    const categoria = cellText(get("categoria")).trim();
    const fonteRaw = cellText(get("fonte")).toLowerCase();

    if (!tipoRaw && !titolo && !dataRaw && !importoRaw) continue; // riga vuota

    if (tipoRaw !== "spesa" && tipoRaw !== "entrata") {
      errori.push({ riga: r, messaggio: `tipo non valido: "${tipoRaw}" (atteso "spesa" o "entrata").` });
      continue;
    }
    const tipo = tipoRaw as "spesa" | "entrata";

    const data = cellDate(dataRaw);
    if (!data) {
      errori.push({ riga: r, messaggio: "data non valida (atteso formato YYYY-MM-DD)." });
      continue;
    }

    const importo = cellAmount(importoRaw);
    if (importo === null || importo <= 0) {
      errori.push({ riga: r, messaggio: "importo non valido (atteso un numero positivo)." });
      continue;
    }

    const categorieAmmesse = tipo === "spesa" ? CATEGORIE_SPESA : CATEGORIE_ENTRATA;
    if (!categorieAmmesse.has(categoria)) {
      errori.push({
        riga: r,
        messaggio: `categoria "${categoria}" non ammessa per tipo ${tipo} (ammesse: ${[...categorieAmmesse].join(", ")}).`,
      });
      continue;
    }

    if (!titolo) {
      errori.push({ riga: r, messaggio: "titolo mancante." });
      continue;
    }

    if (!FONTI_AMMESSE.has(fonteRaw)) {
      errori.push({ riga: r, messaggio: `fonte non valida: "${fonteRaw}" (atteso "crypto" o "intesa").` });
      continue;
    }
    const fonte = fonteRaw as "crypto" | "intesa";

    righeValide.push({
      tipo,
      data,
      importo,
      categoria,
      titolo,
      descrizione: cellText(get("descrizione")).trim() || null,
      nominativo: cellText(get("nominativo")).trim() || null,
      dettaglio: cellText(get("dettaglio")).trim() || null,
      fonte,
    });
  }

  return { ok: true, righeValide, errori };
}
