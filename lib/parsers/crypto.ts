import Papa from "papaparse";
import { parseImporto } from "@/lib/csv";
import type { DraftSpesaRow, ParseResult } from "./types";

const CATEGORIA_DEFAULT = "Da categorizzare";

function parseCryptoTimestamp(raw: string | undefined): string | null {
  if (!raw) return null;
  // Formato Crypto.com: "2026-07-09 14:32:10" (UTC)
  const match = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

export function parseCryptoCsv(text: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    return { ok: false, error: `CSV non valido: ${parsed.errors[0].message}` };
  }

  const headers = (parsed.meta.fields ?? []).map((h) => h.trim());
  const timestampCol = headers.find((h) => h.toLowerCase() === "timestamp (utc)");
  const descriptionCol = headers.find((h) => h.toLowerCase() === "transaction description");
  const amountCol = headers.find((h) => h.toLowerCase() === "amount");

  if (!timestampCol || !descriptionCol || !amountCol) {
    return {
      ok: false,
      error:
        "CSV Crypto.com non riconosciuto: mancano le colonne 'Timestamp (UTC)', 'Transaction Description' o 'Amount'.",
    };
  }

  const skippedInvalidRows: number[] = [];
  let skippedIgnored = 0;
  const spese: DraftSpesaRow[] = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const raw = parsed.data[i];
    const descrizione = raw[descriptionCol]?.trim() ?? "";

    if (descrizione === "EUR Deposit" || descrizione.startsWith("Refund:")) {
      skippedIgnored++;
      continue;
    }

    const importo = parseImporto(raw[amountCol]);
    const data = parseCryptoTimestamp(raw[timestampCol]);

    if (importo === null || data === null) {
      skippedInvalidRows.push(i + 2);
      continue;
    }

    if (importo >= 0) {
      // Solo gli importi negativi (uscite) sono gestiti da questa spec.
      skippedIgnored++;
      continue;
    }

    spese.push({
      importo: Math.abs(importo),
      titolo: descrizione,
      descrizione,
      categoriaNome: CATEGORIA_DEFAULT,
      categoria_banca: null,
      data,
      fonte: "crypto.com",
    });
  }

  return { ok: true, spese, depositi: [], skippedIgnored, skippedInvalidRows };
}
