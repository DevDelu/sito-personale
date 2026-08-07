import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Evento, IntegrazioneGoogle, NotaGiorno } from "./types";

// Eventi che si sovrappongono al range [from, to): copre anche quelli
// iniziati prima ma ancora in corso (es. multi-giorno), non solo quelli con
// data_inizio dentro il range.
export async function getEventiRange(from: string, to: string): Promise<Evento[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("eventi")
    .select("*")
    .lt("data_inizio", to)
    .gt("data_fine", from)
    .order("data_inizio");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getEvento(id: string): Promise<Evento | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("eventi").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function getNotaGiorno(data: string): Promise<NotaGiorno | null> {
  const admin = createAdminClient();
  const { data: row, error } = await admin.from("note_giorno").select("*").eq("data", data).maybeSingle();
  if (error) throw new Error(error.message);
  return row ?? null;
}

// Note del range visibile nel calendario, stesso principio di
// getEventiRange: caricate tutte insieme per evitare una fetch per giorno
// quando si apre il pannello. `from`/`to` sono date semplici (YYYY-MM-DD),
// non timestamp — note_giorno.data è una colonna `date`.
export async function getNoteRange(from: string, to: string): Promise<NotaGiorno[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("note_giorno").select("*").gte("data", from).lt("data", to);
  if (error) throw new Error(error.message);
  return data ?? [];
}

// Riga singola (un solo utente): se assente, il collegamento Google non è
// mai stato avviato — trattato come stato "non_connesso" dal chiamante.
export async function getIntegrazioneGoogle(): Promise<IntegrazioneGoogle | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("integrazione_google").select("*").limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}
