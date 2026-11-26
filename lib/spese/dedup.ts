import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ImportRow } from "@/lib/parsers/import-excel";
import { leggiAPagine } from "./pagine";

export type PreviewRow = ImportRow & { duplicato: boolean };

function dedupKey(r: { data: string; importo: number; titolo: string | null; fonte: string }): string {
  return `${r.data}|${r.importo.toFixed(2)}|${(r.titolo ?? "").trim().toLowerCase()}|${r.fonte}`;
}

// Chiave composita (data, importo, titolo, fonte): confronta le righe del
// file con quelle già presenti in spese/depositi, con letture
// a blocchi sul range di date del file invece di una query per riga.
export async function flagDuplicates(righe: ImportRow[]): Promise<PreviewRow[]> {
  if (righe.length === 0) return [];

  const admin = createAdminClient();
  const dates = righe.map((r) => r.data).sort();
  const min = dates[0];
  const max = dates[dates.length - 1];

  // A pagine: oltre 1000 righe nel periodo del file, quelle non lette
  // risulterebbero "nuove" e si potrebbero importare due volte.
  const giaPresenti = (tabella: "spese" | "depositi") =>
    leggiAPagine((da, a) =>
      admin
        .from(tabella)
        .select("data, importo, titolo, fonte")
        .gte("data", min)
        .lte("data", max)
        .order("id", { ascending: true })
        .range(da, a)
    );
  const [spese, depositi] = await Promise.all([giaPresenti("spese"), giaPresenti("depositi")]);

  const speseKeys = new Set(spese.map((r) => dedupKey({ ...r, importo: Number(r.importo) })));
  const depositiKeys = new Set(depositi.map((r) => dedupKey({ ...r, importo: Number(r.importo) })));

  return righe.map((r) => ({
    ...r,
    duplicato: (r.tipo === "spesa" ? speseKeys : depositiKeys).has(dedupKey(r)),
  }));
}
