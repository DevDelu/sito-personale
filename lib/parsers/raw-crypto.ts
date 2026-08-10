import type { ImportRowError } from "@/lib/parsers/import-excel";

export type RawTransaction = {
  data: string; // YYYY-MM-DD
  importo: number; // sempre positivo
  tipo: "spesa" | "entrata";
  descrizioneGrezza: string; // per il motore di regole
  dettagliGrezzi: string; // testo esteso se disponibile (Intesa "Dettagli"), altrimenti = descrizioneGrezza
  categoriaBanca: string | null;
  fonte: "crypto" | "intesa";
};

const COLONNE_CRYPTO = [
  "Timestamp (UTC)",
  "Transaction Description",
  "Currency",
  "Amount",
  "To Currency",
  "To Amount",
  "Native Currency",
  "Native Amount",
  "Native Amount (in USD)",
  "Transaction Kind",
  "Transaction Hash",
] as const;

// Parser CSV manuale: rispetta i campi tra virgolette (con eventuale virgola
// interna), niente dipendenza esterna. I file Crypto.com reali osservati non
// hanno virgole dentro i campi testo, ma non ci si può affidare a questo.
function parseCsvLine(line: string): string[] {
  const campi: string[] = [];
  let corrente = "";
  let dentroVirgolette = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (dentroVirgolette) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          corrente += '"';
          i++;
        } else {
          dentroVirgolette = false;
        }
      } else {
        corrente += ch;
      }
    } else if (ch === '"') {
      dentroVirgolette = true;
    } else if (ch === ",") {
      campi.push(corrente);
      corrente = "";
    } else {
      corrente += ch;
    }
  }
  campi.push(corrente);
  return campi.map((c) => c.trim());
}

function parseAmount(text: string): number | null {
  const t = text.trim().replace(",", ".");
  const n = Number(t);
  return t && Number.isFinite(n) ? n : null;
}

export function parseCryptoRawCsv(testo: string): { righe: RawTransaction[]; errori: ImportRowError[] } {
  const righe: RawTransaction[] = [];
  const errori: ImportRowError[] = [];

  const linee = testo.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (linee.length === 0) return { righe, errori };

  const headerCells = parseCsvLine(linee[0]).map((h) => h.trim().toLowerCase());
  const colIndex: Partial<Record<(typeof COLONNE_CRYPTO)[number], number>> = {};
  for (const nome of COLONNE_CRYPTO) {
    const idx = headerCells.findIndex((h) => h === nome.toLowerCase());
    if (idx !== -1) colIndex[nome] = idx;
  }

  const mancanti = COLONNE_CRYPTO.filter((c) => colIndex[c] === undefined);
  if (mancanti.length > 0) {
    errori.push({
      riga: 1,
      messaggio: `Colonne mancanti nel CSV Crypto.com: ${mancanti.join(", ")}.`,
    });
    return { righe, errori };
  }

  for (let r = 1; r < linee.length; r++) {
    const rigaNumero = r + 1; // 1-based, header è riga 1
    const campi = parseCsvLine(linee[r]);
    const get = (col: (typeof COLONNE_CRYPTO)[number]) => (campi[colIndex[col]!] ?? "").trim();

    const timestamp = get("Timestamp (UTC)");
    if (!timestamp) continue; // riga vuota

    const dataMatch = timestamp.match(/^(\d{4}-\d{2}-\d{2})/);
    if (!dataMatch) {
      errori.push({ riga: rigaNumero, messaggio: `Timestamp non valido: "${timestamp}".` });
      continue;
    }

    const nativeCurrency = get("Native Currency");
    if (nativeCurrency.toUpperCase() !== "EUR") {
      errori.push({
        riga: rigaNumero,
        messaggio: `Native Currency "${nativeCurrency}" diversa da EUR: riga non categorizzata automaticamente.`,
      });
      continue;
    }

    const nativeAmount = parseAmount(get("Native Amount"));
    if (nativeAmount === null) {
      errori.push({ riga: rigaNumero, messaggio: `Native Amount non valido: "${get("Native Amount")}".` });
      continue;
    }
    if (nativeAmount === 0) continue; // riga senza movimento economico

    righe.push({
      data: dataMatch[1],
      importo: Math.abs(nativeAmount),
      tipo: nativeAmount < 0 ? "spesa" : "entrata",
      descrizioneGrezza: get("Transaction Description"),
      dettagliGrezzi: get("Transaction Description"),
      categoriaBanca: null,
      fonte: "crypto",
    });
  }

  return { righe, errori };
}
