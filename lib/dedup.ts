// Ogni sorgente di import definisce la propria chiave di deduplicazione
// (vedi spec_modulo_spese_v2.md), applicata sia alle righe candidate sia a
// quelle già presenti nel DB durante il confronto.

export function keyGenerico(row: {
  data: string;
  importo: number;
  descrizione: string | null;
  categoria_id: string | null;
}): string {
  return `${row.data}|${row.importo.toFixed(2)}|${row.descrizione ?? ""}|${
    row.categoria_id ?? ""
  }`;
}

export function keyCrypto(row: { data: string; importo: number; titolo: string | null }): string {
  return `${row.data}|${row.importo.toFixed(2)}|${row.titolo ?? ""}`;
}

export function keyIntesa(row: {
  data: string;
  importo: number;
  titolo: string | null;
  descrizione: string | null;
}): string {
  return `${row.data}|${row.importo.toFixed(2)}|${row.titolo ?? ""}|${row.descrizione ?? ""}`;
}
