"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/dal";
import { decryptToken } from "@/lib/agenda/crypto";
import { deleteEventFromGoogle, refreshAccessToken } from "@/lib/agenda/google-client";
import type { CategoriaEvento } from "@/lib/agenda/types";

export type AgendaActionResult = { error?: string };

export type EventoPatch = {
  titolo: string;
  descrizione: string | null;
  luogo: string | null;
  data_inizio: string;
  data_fine: string;
  tutto_il_giorno: boolean;
  categoria: CategoriaEvento;
};

export async function creaEvento(patch: EventoPatch): Promise<AgendaActionResult> {
  await requireUser();
  if (!patch.titolo.trim()) return { error: "Il titolo è obbligatorio." };

  const admin = createAdminClient();
  const { error } = await admin.from("eventi").insert({
    titolo: patch.titolo.trim(),
    descrizione: patch.descrizione?.trim() || null,
    luogo: patch.luogo?.trim() || null,
    data_inizio: patch.data_inizio,
    data_fine: patch.data_fine,
    tutto_il_giorno: patch.tutto_il_giorno,
    categoria: patch.categoria,
    source: "manuale",
    sync_status: "pending_push",
  });
  if (error) return { error: error.message };

  revalidatePath("/agenda");
  return {};
}

// Usata anche da drag&drop/resize sul calendario (solo data_inizio/data_fine
// nel patch in quel caso). Qualunque modifica locale riporta l'evento a
// pending_push: la prossima sync lo ripropaga a Google.
export async function aggiornaEvento(id: string, patch: Partial<EventoPatch>): Promise<AgendaActionResult> {
  await requireUser();
  if (patch.titolo !== undefined && !patch.titolo.trim()) return { error: "Il titolo è obbligatorio." };

  const columnPatch: Record<string, unknown> = { sync_status: "pending_push" };
  if (patch.titolo !== undefined) columnPatch.titolo = patch.titolo.trim();
  if (patch.descrizione !== undefined) columnPatch.descrizione = patch.descrizione?.trim() || null;
  if (patch.luogo !== undefined) columnPatch.luogo = patch.luogo?.trim() || null;
  if (patch.data_inizio !== undefined) columnPatch.data_inizio = patch.data_inizio;
  if (patch.data_fine !== undefined) columnPatch.data_fine = patch.data_fine;
  if (patch.tutto_il_giorno !== undefined) columnPatch.tutto_il_giorno = patch.tutto_il_giorno;
  if (patch.categoria !== undefined) columnPatch.categoria = patch.categoria;

  const admin = createAdminClient();
  const { error } = await admin.from("eventi").update(columnPatch).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/agenda");
  return {};
}

export async function eliminaEvento(id: string): Promise<AgendaActionResult> {
  await requireUser();

  const admin = createAdminClient();
  const { data: evento, error: fetchError } = await admin
    .from("eventi")
    .select("google_event_id")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) return { error: fetchError.message };

  // L'eliminazione locale non deve mai restare bloccata da un problema lato
  // Google (token scaduto, rete, sync mai avviata...): si tenta la
  // cancellazione anche su Calendar, ma un suo fallimento non impedisce la
  // cancellazione della riga — l'app resta usabile offline-da-Google, come
  // creazione/modifica.
  if (evento?.google_event_id) {
    try {
      const { data: integrazione } = await admin
        .from("integrazione_google")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (integrazione?.stato === "connesso" && integrazione.refresh_token_enc) {
        const refreshToken = decryptToken(integrazione.refresh_token_enc);
        const tokens = await refreshAccessToken(refreshToken);
        await deleteEventFromGoogle(evento.google_event_id, tokens.access_token);
      }
    } catch {
      // Ignorato di proposito: vedi commento sopra.
    }
  }

  const { error } = await admin.from("eventi").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/agenda");
  return {};
}

export async function salvaNotaGiorno(data: string, contenuto: string): Promise<AgendaActionResult> {
  await requireUser();

  const admin = createAdminClient();
  const { error } = await admin
    .from("note_giorno")
    .upsert({ data, contenuto, updated_at: new Date().toISOString() }, { onConflict: "data" });
  if (error) return { error: error.message };

  revalidatePath("/agenda");
  return {};
}

// Riga singola upsert-ata "a mano" (nessun onConflict: la migration 022 ne
// garantisce sempre esattamente una) — se per qualche motivo manca ancora,
// la si crea qui invece di fallire silenziosamente.
export async function aggiornaPromemoriaNote(attivo: boolean): Promise<AgendaActionResult> {
  await requireUser();

  const admin = createAdminClient();
  const { data: esistente, error: fetchError } = await admin
    .from("agenda_impostazioni")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (fetchError) return { error: fetchError.message };

  const { error } = esistente
    ? await admin.from("agenda_impostazioni").update({ promemoria_note_attivo: attivo }).eq("id", esistente.id)
    : await admin.from("agenda_impostazioni").insert({ promemoria_note_attivo: attivo });
  if (error) return { error: error.message };

  revalidatePath("/agenda");
  return {};
}
