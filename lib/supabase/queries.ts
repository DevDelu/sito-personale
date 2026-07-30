import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Categoria, Deposito, Spesa } from "@/lib/types";

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
// selettore periodo/range in dashboard aggiorna l'URL, che rifà girare
// questa query con `from`/`to` nuovi.
export async function getDashboardData(
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
    spese: (speseRes.data ?? []).map((r) => ({
      ...r,
      importo: Number(r.importo),
    })),
    categorie: categorieRes.data ?? [],
    depositi: (depositiRes.data ?? []).map((r) => ({
      ...r,
      importo: Number(r.importo),
    })),
  };
}
