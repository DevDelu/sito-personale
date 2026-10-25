import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Categoria, Deposito, Movimento, Spesa } from "@/lib/types";
import type { SpesaGrezza } from "./ricorrenti";

export async function getCategorie(): Promise<Categoria[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("categorie")
    .select("id, nome, colore, tipo")
    .order("nome");
  if (error) throw new Error(error.message);
  return data ?? [];
}

// Filtrata lato server per data (non si scarica mai tutto lo storico): il
// selettore periodo/range nella Overview aggiorna l'URL, che rifà girare
// questa query con `from`/`to` nuovi.
export async function getOverviewData(
  from: string,
  to: string
): Promise<{
  spese: Spesa[];
  categorie: Categoria[];
  depositi: Deposito[];
}> {
  const admin = createAdminClient();

  const [speseRes, categorieRes, depositiRes] = await Promise.all([
    admin
      .from("spese_con_categoria")
      .select("*")
      .gte("data", from)
      .lte("data", to)
      .order("data", { ascending: false }),
    admin.from("categorie").select("id, nome, colore, tipo").order("nome"),
    admin
      .from("depositi_con_categoria")
      .select("*")
      .gte("data", from)
      .lte("data", to)
      .order("data", { ascending: false }),
  ]);

  if (speseRes.error) throw new Error(speseRes.error.message);
  if (categorieRes.error) throw new Error(categorieRes.error.message);
  if (depositiRes.error) throw new Error(depositiRes.error.message);

  return {
    spese: (speseRes.data ?? []).map((r) => ({ ...r, importo: Number(r.importo) })),
    categorie: categorieRes.data ?? [],
    depositi: (depositiRes.data ?? []).map((r) => ({ ...r, importo: Number(r.importo) })),
  };
}

// Ultimi 13 mesi di spese (solo titolo, importo, data) per il rilevamento delle
// ricorrenti, indipendente dal periodo scelto nella Overview. Paginata:
// PostgREST restituisce al massimo 1000 righe per richiesta.
export async function getSpesePerRicorrenti(oggiIso: string): Promise<SpesaGrezza[]> {
  const admin = createAdminClient();
  const [a, m, g] = oggiIso.split("-").map(Number);
  const da = new Date(Date.UTC(a, m - 1 - 13, g)).toISOString().slice(0, 10);
  const PAGINA = 1000;
  const righe: SpesaGrezza[] = [];
  for (let from = 0; ; from += PAGINA) {
    const { data, error } = await admin
      .from("spese_con_categoria")
      .select("titolo, importo, data")
      .gte("data", da)
      .lte("data", oggiIso)
      .order("data", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGINA - 1);
    if (error) throw new Error(error.message);
    for (const r of data ?? []) righe.push({ titolo: r.titolo, importo: Number(r.importo), data: r.data });
    if (!data || data.length < PAGINA) break;
  }
  return righe;
}

export type MovimentiFiltri = {
  search?: string;
  categoria?: string;
  tipo?: "spesa" | "entrata";
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
};

export async function getMovimenti(
  filtri: MovimentiFiltri
): Promise<{ rows: Movimento[]; total: number }> {
  const admin = createAdminClient();
  const offset = (filtri.page - 1) * filtri.pageSize;

  let query = admin
    .from("movimenti_con_categoria")
    .select("*", { count: "exact" })
    .order("data", { ascending: false })
    .range(offset, offset + filtri.pageSize - 1);

  if (filtri.search) {
    const term = filtri.search.replace(/[%,]/g, "");
    query = query.or(`titolo.ilike.%${term}%,descrizione.ilike.%${term}%`);
  }
  if (filtri.categoria) query = query.eq("categoria_nome", filtri.categoria);
  if (filtri.tipo) query = query.eq("tipo", filtri.tipo);
  if (filtri.from) query = query.gte("data", filtri.from);
  if (filtri.to) query = query.lte("data", filtri.to);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    rows: (data ?? []).map((r) => ({ ...r, importo: Number(r.importo) })),
    total: count ?? 0,
  };
}
