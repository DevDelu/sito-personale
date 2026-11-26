import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Categoria, Deposito, Movimento, Spesa } from "@/lib/types";
import { aggiungiMesi, type SpesaGrezza } from "./ricorrenti";
import { FONTI_NON_IMPORT } from "./ultimo-import";
import { leggiAPagine } from "./pagine";

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

  // A pagine: su un periodo lungo oltre 1000 righe i totali sarebbero parziali.
  // `id` rende univoco l'ordinamento tra movimenti dello stesso giorno.
  const righeDi = (vista: "spese_con_categoria" | "depositi_con_categoria") =>
    admin
      .from(vista)
      .select("*")
      .gte("data", from)
      .lte("data", to)
      .order("data", { ascending: false });

  const [spese, categorieRes, depositi] = await Promise.all([
    leggiAPagine((da, a) => righeDi("spese_con_categoria").order("id", { ascending: true }).range(da, a)),
    admin.from("categorie").select("id, nome, colore, tipo").order("nome"),
    leggiAPagine((da, a) => righeDi("depositi_con_categoria").order("id", { ascending: true }).range(da, a)),
  ]);

  if (categorieRes.error) throw new Error(categorieRes.error.message);

  return {
    spese: spese.map((r) => ({ ...r, importo: Number(r.importo) })),
    categorie: categorieRes.data ?? [],
    depositi: depositi.map((r) => ({ ...r, importo: Number(r.importo) })),
  };
}

// Ultimi 25 mesi (servono 3 addebiti annuali) di spese (solo titolo, importo, data) per il rilevamento delle
// ricorrenti, indipendente dal periodo scelto nella Overview. Paginata:
// PostgREST restituisce al massimo 1000 righe per richiesta.
export async function getSpesePerRicorrenti(oggiIso: string): Promise<SpesaGrezza[]> {
  const admin = createAdminClient();
  const da = aggiungiMesi(oggiIso, -25);
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

// Somme di un periodo (per il confronto col periodo precedente): scarica solo
// l'importo, paginato per il limite di 1000 righe di PostgREST.
export async function getTotaliPeriodo(from: string, to: string): Promise<{ entrate: number; uscite: number }> {
  const admin = createAdminClient();
  const PAGINA = 1000;
  async function somma(vista: "spese_con_categoria" | "depositi_con_categoria"): Promise<number> {
    let totale = 0;
    for (let da = 0; ; da += PAGINA) {
      const { data, error } = await admin
        .from(vista)
        .select("importo")
        .gte("data", from)
        .lte("data", to)
        .order("id", { ascending: true })
        .range(da, da + PAGINA - 1);
      if (error) throw new Error(error.message);
      for (const r of data ?? []) totale += Number(r.importo);
      if (!data || data.length < PAGINA) break;
    }
    return totale;
  }
  const [uscite, entrate] = await Promise.all([somma("spese_con_categoria"), somma("depositi_con_categoria")]);
  return { entrate, uscite };
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

// Data di inserimento (created_at) della spesa importata più di recente, o
// null se non ce ne sono. Esclude le spese scritte a mano o dall'assistente.
export async function getUltimoInserimentoImport(): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("spese")
    .select("created_at")
    .not("fonte", "in", `(${FONTI_NON_IMPORT.join(",")})`)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  return data?.[0]?.created_at ?? null;
}
