"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/dal";
import type { TipoMetrica, TipoRiga } from "@/lib/allenamento/types";

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

// Riusata sia a fine sessione live (terminaSessione) sia dalla gestione
// storico per correggere durata/sensazione/note di una sessione passata.
export async function aggiornaSessione(
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

  revalidatePath("/allenamenti/storico");
  return {};
}

export async function terminaSessione(
  sessioneId: string,
  patch: FineSessionePatch
): Promise<AllenamentoActionResult> {
  const res = await aggiornaSessione(sessioneId, patch);
  if (res.error) return res;

  revalidatePath("/allenamenti");
  return {};
}

// ---------------------------------------------------------------------------
// Gestione storico sessioni (FIX 10): modifica/eliminazione di sessioni già
// svolte e delle loro righe di log. La "tabella progressi" è calcolata a
// runtime da queste stesse tabelle (getUltimeSessioniConLog), quindi riflette
// subito ogni modifica: nessuna cache da invalidare oltre a revalidatePath.
// ---------------------------------------------------------------------------

export async function eliminaSessione(sessioneId: string): Promise<AllenamentoActionResult> {
  await requireUser();

  const admin = createAdminClient();
  // Cascade su sessioni_log gestito dalla FK "on delete cascade" (migration 016).
  const { error } = await admin.from("sessioni").delete().eq("id", sessioneId);
  if (error) return { error: error.message };

  revalidatePath("/allenamenti/storico");
  return {};
}

export async function aggiornaSessioneLog(
  logId: string,
  patch: Omit<LogSeriePatch, "scheda_esercizio_id">
): Promise<AllenamentoActionResult> {
  await requireUser();

  const admin = createAdminClient();
  const { error } = await admin
    .from("sessioni_log")
    .update({
      serie_effettive: patch.serie_effettive ?? null,
      rip_effettive: patch.rip_effettive ?? null,
      peso_effettivo: patch.peso_effettivo ?? null,
      tempo_effettivo_sec: patch.tempo_effettivo_sec ?? null,
    })
    .eq("id", logId);
  if (error) return { error: error.message };

  revalidatePath("/allenamenti/storico");
  return {};
}

export async function eliminaSessioneLog(logId: string): Promise<AllenamentoActionResult> {
  await requireUser();

  const admin = createAdminClient();
  const { error } = await admin.from("sessioni_log").delete().eq("id", logId);
  if (error) return { error: error.message };

  revalidatePath("/allenamenti/storico");
  return {};
}

// ---------------------------------------------------------------------------
// Gestione scheda (FIX 9): CRUD su blocchi/esercizi della scheda, letta a
// runtime dalla sessione live (getSchedaEsercizi) — una modifica qui si
// riflette subito nella prossima sessione, nessuna costante da aggiornare.
// ---------------------------------------------------------------------------

export type SchedaEsercizioFields = {
  blocco: string;
  tipo_riga: TipoRiga;
  target_serie: number | null;
  target_rip_min: number | null;
  target_rip_max: number | null;
  target_peso: number | null;
  target_tempo_sec: number | null;
  riposo_sec: number | null;
  rounds: number | null;
  lavoro_sec: number | null;
  pausa_sec: number | null;
  zona_corporea: string | null;
  note: string | null;
};

export type SchedaEsercizioPatch = SchedaEsercizioFields & { esercizio_id: string };

export type NuovoSchedaEsercizioInput = SchedaEsercizioFields & {
  scheda_id: string;
  esercizio_id?: string;
  nuovo_esercizio_nome?: string;
  nuovo_esercizio_tipo_metrica?: TipoMetrica;
};

function schedaEsercizioColumns(fields: SchedaEsercizioFields) {
  return {
    blocco: fields.blocco.trim(),
    tipo_riga: fields.tipo_riga,
    target_serie: fields.target_serie,
    target_rip_min: fields.target_rip_min,
    target_rip_max: fields.target_rip_max,
    target_peso: fields.target_peso,
    target_tempo_sec: fields.target_tempo_sec,
    riposo_sec: fields.riposo_sec,
    rounds: fields.rounds,
    lavoro_sec: fields.lavoro_sec,
    pausa_sec: fields.pausa_sec,
    zona_corporea: fields.zona_corporea?.trim() || null,
    note: fields.note?.trim() || null,
  };
}

export async function aggiornaSchedaEsercizio(
  id: string,
  patch: SchedaEsercizioPatch
): Promise<AllenamentoActionResult> {
  await requireUser();
  if (!patch.blocco.trim()) return { error: "Il nome del blocco è obbligatorio." };
  if (!patch.esercizio_id) return { error: "Seleziona un esercizio." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("scheda_esercizi")
    .update({ esercizio_id: patch.esercizio_id, ...schedaEsercizioColumns(patch) })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/allenamenti/scheda");
  revalidatePath("/allenamenti");
  return {};
}

export async function eliminaSchedaEsercizio(id: string): Promise<AllenamentoActionResult> {
  await requireUser();

  const admin = createAdminClient();
  const { error } = await admin.from("scheda_esercizi").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/allenamenti/scheda");
  revalidatePath("/allenamenti");
  return {};
}

export async function aggiungiSchedaEsercizio(
  input: NuovoSchedaEsercizioInput
): Promise<AllenamentoActionResult> {
  await requireUser();
  if (!input.blocco.trim()) return { error: "Il nome del blocco è obbligatorio." };

  const admin = createAdminClient();

  let esercizioId = input.esercizio_id;
  if (!esercizioId) {
    const nome = input.nuovo_esercizio_nome?.trim();
    if (!nome) return { error: "Seleziona un esercizio dal catalogo o inseriscine uno nuovo." };
    const { data: nuovoEsercizio, error: eserError } = await admin
      .from("esercizi")
      .insert({ nome, tipo_metrica: input.nuovo_esercizio_tipo_metrica ?? "serie_rip" })
      .select("id")
      .single();
    if (eserError) return { error: eserError.message };
    esercizioId = nuovoEsercizio.id as string;
  }

  // Si aggiunge sempre in coda alla sequenza globale della scheda (poi
  // riordinabile con "sposta su/giù"): evita di dover ricalcolare l'ordine
  // di tutte le righe esistenti ad ogni inserimento.
  const { data: ultimaRiga, error: ordError } = await admin
    .from("scheda_esercizi")
    .select("ordine")
    .eq("scheda_id", input.scheda_id)
    .order("ordine", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (ordError) return { error: ordError.message };
  const ordine = (ultimaRiga?.ordine ?? 0) + 1;

  const { error } = await admin.from("scheda_esercizi").insert({
    scheda_id: input.scheda_id,
    esercizio_id: esercizioId,
    ordine,
    ...schedaEsercizioColumns(input),
  });
  if (error) return { error: error.message };

  revalidatePath("/allenamenti/scheda");
  revalidatePath("/allenamenti");
  return {};
}

// Riordino (blocchi o esercizi dentro un blocco) via pulsanti su/giù: il
// client ricalcola l'intera sequenza desiderata e manda qui l'elenco
// completo degli id — il server si limita a rinumerare `ordine` 1..N, stessa
// sequenza globale descritta nella migration 016.
export async function riordinaSchedaEsercizi(idsInOrdine: string[]): Promise<AllenamentoActionResult> {
  await requireUser();

  const admin = createAdminClient();
  const risultati = await Promise.all(
    idsInOrdine.map((id, index) => admin.from("scheda_esercizi").update({ ordine: index + 1 }).eq("id", id))
  );
  const fallito = risultati.find((r) => r.error);
  if (fallito?.error) return { error: fallito.error.message };

  revalidatePath("/allenamenti/scheda");
  revalidatePath("/allenamenti");
  return {};
}

export async function rinominaBlocco(
  schedaId: string,
  vecchioNome: string,
  nuovoNome: string
): Promise<AllenamentoActionResult> {
  await requireUser();
  if (!nuovoNome.trim()) return { error: "Il nome del blocco è obbligatorio." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("scheda_esercizi")
    .update({ blocco: nuovoNome.trim() })
    .eq("scheda_id", schedaId)
    .eq("blocco", vecchioNome);
  if (error) return { error: error.message };

  revalidatePath("/allenamenti/scheda");
  revalidatePath("/allenamenti");
  return {};
}

export async function eliminaBlocco(schedaId: string, nome: string): Promise<AllenamentoActionResult> {
  await requireUser();

  const admin = createAdminClient();
  const { error } = await admin.from("scheda_esercizi").delete().eq("scheda_id", schedaId).eq("blocco", nome);
  if (error) return { error: error.message };

  revalidatePath("/allenamenti/scheda");
  revalidatePath("/allenamenti");
  return {};
}
