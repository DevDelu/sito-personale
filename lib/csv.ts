export function parseImporto(raw: string | undefined | null): number | null {
  if (!raw) return null;
  let s = raw.trim().replace(/[€$\s]/g, "");
  if (!s) return null;

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) {
    // L'ultimo separatore incontrato è quello decimale, l'altro è delle migliaia.
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (hasComma) {
    s = s.replace(",", ".");
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function parseData(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const s = raw.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const match = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }

  return null;
}

// Lunedì (ISO) della settimana della data fornita, formato YYYY-MM-DD.
export function mondayOf(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

const HEADER_ALIASES: Record<string, string[]> = {
  importo: ["importo", "amount", "prezzo"],
  descrizione: ["descrizione", "description", "note", "nota"],
  data: ["data", "date"],
  categoria: ["categoria", "category"],
};

export function resolveColumn(
  headers: string[],
  field: keyof typeof HEADER_ALIASES
): string | null {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  const aliases = HEADER_ALIASES[field];
  for (const alias of aliases) {
    const idx = normalized.indexOf(alias);
    if (idx !== -1) return headers[idx];
  }
  return null;
}

export function dedupKey(row: {
  data: string;
  importo: number;
  descrizione: string | null;
  categoria_id: string | null;
}): string {
  return `${row.data}|${row.importo.toFixed(2)}|${row.descrizione ?? ""}|${
    row.categoria_id ?? ""
  }`;
}
