import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PushSubscriptionPayload, PushSubscriptionRow } from "./types";

// Tabella non ancora esistente finché non viene eseguita la migration
// 030_push_subscriptions.sql (manuale, vedi CLAUDE.md): PostgREST risponde
// con "undefined_table"/schema cache miss invece di un array vuoto.
// sendPushToOwner() e le route in app/api/push/* intercettano questo caso
// per degradare a "non configurato" invece di rompere la pagina.
export function isTabellaMancante(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "42P01" || error.code === "PGRST205" || /relation .* does not exist/i.test(error.message ?? "");
}

export async function salvaSubscription(payload: PushSubscriptionPayload, userAgent: string | null) {
  const admin = createAdminClient();
  const { error } = await admin.from("push_subscriptions").upsert(
    {
      endpoint: payload.endpoint,
      p256dh: payload.keys.p256dh,
      auth: payload.keys.auth,
      user_agent: userAgent,
    },
    { onConflict: "endpoint" }
  );
  if (error) throw error;
}

export async function rimuoviSubscription(endpoint: string) {
  const admin = createAdminClient();
  const { error } = await admin.from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) throw error;
}

export async function listaSubscriptions(): Promise<PushSubscriptionRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("push_subscriptions").select("*");
  if (error) throw error;
  return data ?? [];
}

export async function aggiornaUltimoUso(endpoint: string) {
  const admin = createAdminClient();
  await admin.from("push_subscriptions").update({ last_used_at: new Date().toISOString() }).eq("endpoint", endpoint);
}
