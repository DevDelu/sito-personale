import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Categoria, Deposito, Movimento, Spesa } from "@/lib/types";

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
