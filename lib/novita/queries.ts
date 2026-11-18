import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TipoNovita } from "./testo-pr";

export type NovitaRiga = {
  id: string;
  online_dal: string;
  deploy_sha: string | null;
  pr_number: number;
  pr_url: string | null;
  tipo: TipoNovita;
  titolo: string;
  spiegazione: string;
};

export type ResocontoRiga = {
  id: string;
  created_at: string;
  turno: string;
  titolo: string;
  testo: string;
  azioni_per_te: number;
};

// Tabelle assenti (migration 036 non ancora eseguita): la pagina mostra uno
// stato vuoto invece di rompersi.
function tabellaMancante(error: { code?: string } | null): boolean {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

// Inserisce solo le PR non ancora registrate (pr_number unico) e
// restituisce quelle davvero nuove: servono per la notifica.
export async function registraNovita(
  righe: Omit<NovitaRiga, "id">[]
): Promise<Pick<NovitaRiga, "tipo" | "titolo" | "pr_number">[]> {
  if (righe.length === 0) return [];
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("novita")
    .upsert(righe, { onConflict: "pr_number", ignoreDuplicates: true })
    .select("tipo, titolo, pr_number");
  if (error) throw new Error(error.message);
  return (data ?? []) as Pick<NovitaRiga, "tipo" | "titolo" | "pr_number">[];
}

export async function listaNovita(giorni = 120): Promise<NovitaRiga[]> {
  const admin = createAdminClient();
  const da = new Date(Date.now() - giorni * 86_400_000).toISOString();
  const { data, error } = await admin
    .from("novita")
    .select("id, online_dal, deploy_sha, pr_number, pr_url, tipo, titolo, spiegazione")
    .gte("online_dal", da)
    .order("online_dal", { ascending: false })
    .order("pr_number", { ascending: false })
    .limit(500);
  if (tabellaMancante(error)) return [];
  if (error) throw new Error(error.message);
  return (data ?? []) as NovitaRiga[];
}

export async function contaNovitaRecenti(giorni = 7): Promise<number> {
  const admin = createAdminClient();
  const da = new Date(Date.now() - giorni * 86_400_000).toISOString();
  const { count, error } = await admin
    .from("novita")
    .select("id", { count: "exact", head: true })
    .gte("online_dal", da)
    .neq("tipo", "tecnico");
  if (error) return 0;
  return count ?? 0;
}

export async function inserisciResoconto(r: Omit<ResocontoRiga, "id" | "created_at">): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("resoconti").insert(r).select("id").single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function listaResoconti(limite = 30): Promise<Omit<ResocontoRiga, "testo">[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("resoconti")
    .select("id, created_at, turno, titolo, azioni_per_te")
    .order("created_at", { ascending: false })
    .limit(limite);
  if (tabellaMancante(error)) return [];
  if (error) throw new Error(error.message);
  return (data ?? []) as Omit<ResocontoRiga, "testo">[];
}

export async function getResoconto(id: string): Promise<ResocontoRiga | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("resoconti")
    .select("id, created_at, turno, titolo, testo, azioni_per_te")
    .eq("id", id)
    .maybeSingle();
  if (tabellaMancante(error)) return null;
  if (error) throw new Error(error.message);
  return (data as ResocontoRiga | null) ?? null;
}
