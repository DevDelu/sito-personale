import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ImportRow } from "@/lib/parsers/import-excel";

export type PreviewRow = ImportRow & { duplicato: boolean };

function dedupKey(r: { data: string; importo: number; titolo: string | null; fonte: string }): string {
  return `${r.data}|${r.importo.toFixed(2)}|${(r.titolo ?? "").trim().toLowerCase()}|${r.fonte}`;
}

// Chiave composita (data, importo, titolo, fonte): confronta le righe del
// file con quelle già presenti in spese/depositi, con due query batch sul
// range di date del file invece di una query per riga.
export async function flagDuplicates(righe: ImportRow[]): Promise<PreviewRow[]> {
  if (righe.length === 0) return [];

  const admin = createAdminClient();
  const dates = righe.map((r) => r.data).sort();
  const min = dates[0];
  const max = dates[dates.length - 1];

  const [speseRes, depositiRes] = await Promise.all([
    admin.from("spese").select("data, importo, titolo, fonte").gte("data", min).lte("data", max),
    admin.from("depositi").select("data, importo, titolo, fonte").gte("data", min).lte("data", max),
  ]);
  if (speseRes.error) throw new Error(speseRes.error.message);
  if (depositiRes.error) throw new Error(depositiRes.error.message);

  const speseKeys = new Set(
    (speseRes.data ?? []).map((r) => dedupKey({ ...r, importo: Number(r.importo) }))
  );
  const depositiKeys = new Set(
    (depositiRes.data ?? []).map((r) => dedupKey({ ...r, importo: Number(r.importo) }))
  );

  return righe.map((r) => ({
    ...r,
    duplicato: (r.tipo === "spesa" ? speseKeys : depositiKeys).has(dedupKey(r)),
  }));
}
