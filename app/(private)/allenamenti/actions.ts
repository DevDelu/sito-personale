"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/dal";

export type AllenamentoActionResult = { error?: string };

export type ImpegnoFissoPatch = {
  giorno_settimana: number;
  titolo: string;
  orario: string | null;
  note: string | null;
};

export async function creaImpegnoFisso(patch: ImpegnoFissoPatch): Promise<AllenamentoActionResult> {
  await requireUser();

  if (!patch.titolo.trim()) return { error: "Il titolo è obbligatorio." };
  if (patch.giorno_settimana < 0 || patch.giorno_settimana > 6) {
    return { error: "Giorno della settimana non valido." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("impegni_fissi").insert({
    giorno_settimana: patch.giorno_settimana,
    titolo: patch.titolo.trim(),
    orario: patch.orario?.trim() || null,
    note: patch.note?.trim() || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/allenamenti");
  return {};
}

export async function eliminaImpegnoFisso(id: string): Promise<AllenamentoActionResult> {
  await requireUser();

  const admin = createAdminClient();
  const { error } = await admin.from("impegni_fissi").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/allenamenti");
  return {};
}

// La riga `sessioni` va creata subito all'avvio (non a fine sessione): serve
// il suo id per tutta la durata, per salvare ogni serie incrementalmente in
// sessioni_log man mano che viene completata.
export async function creaSessione(schedaId: string): Promise<{ id: string } | { error: string }> {
  await requireUser();

  const admin = createAdminClient();
  const oggi = new Date().toISOString().slice(0, 10);
  const { data, error } = await admin
    .from("sessioni")
    .insert({ data: oggi, scheda_id: schedaId })
    .select("id")
    .single();
  if (error) return { error: error.message };
  return { id: data.id as string };
}

export type LogSeriePatch = {
  scheda_esercizio_id: string;
  serie_effettive?: number | null;
  rip_effettive?: number | null;
  peso_effettivo?: number | null;
  tempo_effettivo_sec?: number | null;
};

export async function salvaLogSerie(
  sessioneId: string,
  patch: LogSeriePatch
): Promise<AllenamentoActionResult> {
  await requireUser();

  const admin = createAdminClient();
  const { error } = await admin.from("sessioni_log").insert({
    sessione_id: sessioneId,
    scheda_esercizio_id: patch.scheda_esercizio_id,
    serie_effettive: patch.serie_effettive ?? null,
    rip_effettive: patch.rip_effettive ?? null,
    peso_effettivo: patch.peso_effettivo ?? null,
    tempo_effettivo_sec: patch.tempo_effettivo_sec ?? null,
  });
  if (error) return { error: error.message };

  return {};
}

export type FineSessionePatch = {
  durata_min: number | null;
  sensazione: number | null;
  note: string | null;
};

export async function terminaSessione(
  sessioneId: string,
  patch: FineSessionePatch
): Promise<AllenamentoActionResult> {
  await requireUser();

  const admin = createAdminClient();
  const { error } = await admin
    .from("sessioni")
    .update({
      durata_min: patch.durata_min,
      sensazione: patch.sensazione,
      note: patch.note?.trim() || null,
    })
    .eq("id", sessioneId);
  if (error) return { error: error.message };

  revalidatePath("/allenamenti");
  revalidatePath("/allenamenti/storico");
  return {};
}
