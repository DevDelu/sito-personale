import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { MAX_TURNI, type Turno } from "./storia";

// Memoria della chat Telegram (tabella assistente_storia). Una conversazione
// "scade" dopo una pausa lunga: domani mattina non serve ricordare cosa si
// chiedeva ieri sera, e il contesto vecchio confonderebbe il modello.
const PAUSA_NUOVA_CONVERSAZIONE_MIN = 30;

export async function leggiStoriaTelegram(): Promise<Turno[]> {
  const admin = createAdminClient();
  const da = new Date(Date.now() - PAUSA_NUOVA_CONVERSAZIONE_MIN * 60_000).toISOString();
  const { data, error } = await admin
    .from("assistente_storia")
    .select("ruolo, testo")
    .eq("canale", "telegram")
    .gte("created_at", da)
    .order("created_at", { ascending: false })
    .limit(MAX_TURNI);
  if (error) throw new Error(error.message);
  return (data ?? []).reverse().map((r) => ({ role: r.ruolo as Turno["role"], content: r.testo }));
}

export async function salvaScambioTelegram(domanda: string, risposta: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("assistente_storia").insert([
    { canale: "telegram", ruolo: "user", testo: domanda.slice(0, 4000) },
    { canale: "telegram", ruolo: "assistant", testo: risposta.slice(0, 4000) },
  ]);
  if (error) throw new Error(error.message);
}

export async function svuotaStoriaTelegram(): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("assistente_storia").delete().eq("canale", "telegram");
  if (error) throw new Error(error.message);
}
