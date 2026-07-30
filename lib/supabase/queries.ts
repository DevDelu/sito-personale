import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Categoria, Deposito, Spesa } from "@/lib/types";

const HISTORY_DAYS = 180;

export async function getDashboardData(): Promise<{
  spese: Spesa[];
  categorie: Categoria[];
  depositi: Deposito[];
}> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [speseRes, categorieRes, depositiRes] = await Promise.all([
    admin
      .from("spese_con_categoria")
      .select("*")
      .gte("data", since)
      .order("data", { ascending: false }),
    admin.from("categorie").select("id, nome, colore, tipo").order("nome"),
    admin
      .from("depositi_con_categoria")
      .select("*")
      .gte("data", since)
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
