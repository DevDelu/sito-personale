import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FeedbackPayload, FeedbackRow, FeedbackStato } from "./types";

export { isTabellaMancante } from "@/lib/push/queries";

export async function inserisciFeedback(payload: FeedbackPayload) {
  const admin = createAdminClient();
  const contesto = { ...payload.contesto, versione: process.env.VERCEL_GIT_COMMIT_SHA ?? null };
  const { error } = await admin.from("feedback").insert({ ...payload, contesto });
  if (error) throw error;
}

export async function listaFeedbackPerStato(stato: FeedbackStato): Promise<FeedbackRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("feedback")
    .select("*")
    .eq("stato", stato)
    .order("created_at", { ascending: true })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export type AggiornamentoFeedback = {
  stato?: FeedbackStato;
  issue_number?: number;
  pr_number?: number;
};

// Due chiavi di ricerca: `id` (job notturno: il feedback è diventato una
// issue) oppure `issue_number` (workflow al merge: la PR ha chiuso la issue).
export async function aggiornaFeedback(
  filtro: { id: string } | { issue_number: number },
  modifiche: AggiornamentoFeedback
): Promise<number> {
  const admin = createAdminClient();
  let query = admin.from("feedback").update(modifiche);
  query = "id" in filtro ? query.eq("id", filtro.id) : query.eq("issue_number", filtro.issue_number);
  const { data, error } = await query.select("id");
  if (error) throw error;
  return data?.length ?? 0;
}
