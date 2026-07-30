import Papa from "papaparse";
import { parseData, parseImporto, resolveColumn } from "@/lib/csv";
import type { DraftSpesaRow, ParseResult } from "./types";

export function parseGenericCsv(text: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    return { ok: false, error: `CSV non valido: ${parsed.errors[0].message}` };
  }

  const headers = parsed.meta.fields ?? [];
  const col = {
    importo: resolveColumn(headers, "importo"),
    descrizione: resolveColumn(headers, "descrizione"),
    data: resolveColumn(headers, "data"),
    categoria: resolveColumn(headers, "categoria"),
  };

  if (!col.importo || !col.data) {
    return {
      ok: false,
      error:
        "Il CSV deve avere almeno le colonne 'importo' e 'data' (nomi accettati: importo/amount, data/date, descrizione, categoria).",
    };
  }

  const skippedInvalidRows: number[] = [];
  const spese: DraftSpesaRow[] = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const raw = parsed.data[i];
    const importo = parseImporto(raw[col.importo]);
    const data = parseData(raw[col.data]);

    if (importo === null || data === null) {
      skippedInvalidRows.push(i + 2); // +2: header + indice 1-based
      continue;
    }

    const descrizione = col.descrizione ? raw[col.descrizione]?.trim() || null : null;
    const categoriaNome = col.categoria ? raw[col.categoria]?.trim() || null : null;

    spese.push({
      importo,
      titolo: null,
      descrizione,
      categoriaNome,
      categoria_banca: null,
      data,
      fonte: "csv_upload",
    });
  }

  return { ok: true, spese, depositi: [], skippedIgnored: 0, skippedInvalidRows };
}
