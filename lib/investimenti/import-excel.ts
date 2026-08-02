import ExcelJS from "exceljs";
import type { TipoTransazione } from "./types";

// Formato fisso dell'export Fineco "Movimenti Dossier Titoli": 6 righe di
// intestazione libera (dossier n., titolo, ecc.), riga 7 = header colonne,
// riga 8 vuota, dati da riga 9. Le prime righe non sono tabellari quindi si
// legge per POSIZIONE di colonna, non per nome header.
const RIGA_PRIMA_DATO = 9;

const COL = {
  operazione: 1, // data della transazione (gg/mm/aaaa)
  dataValuta: 2,
  descrizione: 3,
  titolo: 4,
  isin: 5,
  segno: 6, // 'A' = acquisto, 'V' = vendita
  quantita: 7,
  divisa: 8,
  prezzo: 9,
  cambio: 10,
  controvalore: 11,
  commissioniFondiSwIngrUscita: 12,
  commissioniFondiBancaCorrispondente: 13,
  speseFondiSgr: 14,
  commissioniAmministrato: 15,
} as const;

export type ImportRowInvestimenti = {
  riga: number;
  isin: string;
  titolo: string;
  tipo: TipoTransazione;
  quantita: number;
  prezzo_unitario: number | null;
  data: string;
  note: string | null;
};

export type ImportRowError = { riga: number; messaggio: string };

export type ImportResultInvestimenti =
  | { ok: true; righeValide: ImportRowInvestimenti[]; errori: ImportRowError[] }
  | { ok: false; error: string };

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("result" in value) return String(value.result ?? "");
  }
  return String(value).trim();
}

function cellDateDMY(value: ExcelJS.CellValue): string | null {
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const text = cellText(value).trim();
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function cellNumber(value: ExcelJS.CellValue): number | null {
  if (typeof value === "number") return value;
  const text = cellText(value).trim().replace(/\./g, "").replace(",", ".");
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
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
  if (sheet.rowCount < RIGA_PRIMA_DATO) {
    return { ok: false, error: "File troppo corto: non sembra un export Fineco Movimenti Dossier Titoli." };
  }

  const righeValide: ImportRowInvestimenti[] = [];
  const errori: ImportRowError[] = [];

  for (let r = RIGA_PRIMA_DATO; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const get = (col: number) => row.getCell(col).value;

    const isin = cellText(get(COL.isin)).trim().toUpperCase();
    const segnoRaw = cellText(get(COL.segno)).trim().toUpperCase();
    const operazioneRaw = get(COL.operazione);
    const quantitaRaw = get(COL.quantita);

    // Righe non-dato (separatori, eventuale riepilogo finale): nessun Isin.
    if (!isin && !segnoRaw && !quantitaRaw && !operazioneRaw) continue;
    if (!isin) continue;

    if (segnoRaw !== "A" && segnoRaw !== "V") {
      errori.push({ riga: r, messaggio: `Segno non valido: "${segnoRaw}" (atteso "A" o "V").` });
      continue;
    }
    const tipo: TipoTransazione = segnoRaw === "A" ? "buy" : "sell";

    const quantita = cellNumber(quantitaRaw);
    if (quantita === null || quantita <= 0) {
      errori.push({ riga: r, messaggio: "Quantita non valida (atteso un numero positivo)." });
      continue;
    }

    const data = cellDateDMY(operazioneRaw);
    if (!data) {
      errori.push({ riga: r, messaggio: "Operazione (data) non valida (atteso gg/mm/aaaa)." });
      continue;
    }

    const controvalore = cellNumber(get(COL.controvalore));
    const prezzo = cellNumber(get(COL.prezzo));
    const commissione = cellNumber(get(COL.commissioniAmministrato)) ?? 0;

    // Prezzo effettivo = controvalore (+ commissione amministrato) / quantità,
    // per un costo di carico "tutto incluso"; fallback sul Prezzo di riga se
    // il Controvalore non è leggibile.
    let prezzo_unitario: number | null = null;
    if (controvalore !== null) {
      prezzo_unitario = (Math.abs(controvalore) + Math.abs(commissione)) / quantita;
    } else if (prezzo !== null) {
      prezzo_unitario = prezzo + Math.abs(commissione) / quantita;
    }

    const titolo = cellText(get(COL.titolo)).trim();

    righeValide.push({
      riga: r,
      isin,
      titolo,
      tipo,
      quantita,
      prezzo_unitario,
      data,
      note:
        commissione !== 0
          ? `Import Fineco: ${titolo || isin}. Commissione amministrato inclusa: ${commissione.toFixed(2)} €.`
          : `Import Fineco: ${titolo || isin}.`,
    });
  }

  return { ok: true, righeValide, errori };
}
