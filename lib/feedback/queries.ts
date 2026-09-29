import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { isNonChiuso, verificaTransizione } from "./stati";
import { spezzaTesto } from "./testo";
import { EVENTO_TESTO_MAX, LIMITI_PRIMA_DI_034 } from "./types";
import type {
  EventoAutore,
  EventoTipo,
  FeedbackEvento,
  FeedbackPayload,
  FeedbackRow,
  FeedbackStato,
} from "./types";

export { isTabellaMancante } from "@/lib/push/queries";

// Tutte le letture/scritture su `feedback` e `feedback_eventi`
// (migration 031 + 033). Ogni cambio di stato passa da cambiaStato(), che
// valida la transizione con la matrice di lib/feedback/stati.ts e scrive la
// riga di timeline: nessuna route aggiorna `stato` direttamente.

type Filtro = { id: string } | { issue_number: number };

async function trova(filtro: Filtro): Promise<FeedbackRow[]> {
  const admin = createAdminClient();
  let query = admin.from("feedback").select("*");
  query = "id" in filtro ? query.eq("id", filtro.id) : query.eq("issue_number", filtro.issue_number);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as FeedbackRow[];
}

export async function aggiungiEvento(evento: {
  feedback_id: string;
  autore: EventoAutore;
  tipo: EventoTipo;
  testo?: string | null;
  stato_da?: FeedbackStato | null;
  stato_a?: FeedbackStato | null;
}) {
  const admin = createAdminClient();
  const testo = evento.testo?.slice(0, EVENTO_TESTO_MAX) ?? null;
  const { error } = await admin.from("feedback_eventi").insert({ ...evento, testo });
  // 23514 = check_violation: migration 034 non ancora applicata e testo
  // oltre il limite vecchio. Lo si salva in più righe invece di perderlo.
  if (error?.code === "23514" && testo && testo.length > LIMITI_PRIMA_DI_034.evento) {
    const righe = spezzaTesto(testo, LIMITI_PRIMA_DI_034.evento).map((parte) => ({ ...evento, testo: parte }));
    const { error: errParti } = await admin.from("feedback_eventi").insert(righe);
    if (errParti) throw errParti;
    return;
  }
  if (error) throw error;
}

export type EsitoInserimento = { ok: true; id: string } | { ok: false; motivo: "non-trovato" | "chiuso" };

// Feedback nuovo, oppure nota su un feedback aperto (payload.nota_per,
// scelto da "Qui hai già N segnalazioni aperte").
export async function inserisciFeedback(payload: FeedbackPayload): Promise<EsitoInserimento> {
  const admin = createAdminClient();
  const { nota_per, ...campi } = payload;

  if (nota_per) {
    const [esistente] = await trova({ id: nota_per });
    if (!esistente) return { ok: false, motivo: "non-trovato" };
    if (!isNonChiuso(esistente.stato)) return { ok: false, motivo: "chiuso" };
    await aggiungiEvento({ feedback_id: nota_per, autore: "lorenzo", tipo: "nota", testo: payload.testo });
    return { ok: true, id: nota_per };
  }

  const contesto = { ...campi.contesto, versione: process.env.VERCEL_GIT_COMMIT_SHA ?? null };
  let riga = { ...campi, contesto };
  // Testo oltre il limite di 031 quando la migration 034 manca: i primi 500
  // caratteri nel feedback, il resto in note consecutive (mai perso).
  let seguito: string[] = [];
  let { data, error } = await admin.from("feedback").insert(riga).select("id").single();
  // 23514 = check_violation: una migration non ancora applicata. Meglio
  // salvare il feedback adattato che perderlo.
  if (error?.code === "23514" && riga.testo.length > LIMITI_PRIMA_DI_034.feedback) {
    const [primo, ...resto] = spezzaTesto(riga.testo, LIMITI_PRIMA_DI_034.feedback);
    riga = { ...riga, testo: primo };
    seguito = resto;
    ({ data, error } = await admin.from("feedback").insert(riga).select("id").single());
  }
  // Migration 032 (origine 'pulsante') non ancora applicata.
  if (error?.code === "23514" && payload.origine === "pulsante") {
    ({ data, error } = await admin.from("feedback").insert({ ...riga, origine: "tab" }).select("id").single());
  }
  if (error) throw error;
  const id = (data as { id: string }).id;
  await aggiungiEvento({ feedback_id: id, autore: "lorenzo", tipo: "cambio-stato", stato_da: null, stato_a: "nuovo" });
  if (seguito.length) {
    await aggiungiEvento({ feedback_id: id, autore: "lorenzo", tipo: "nota", testo: `(seguito del testo) ${seguito.join(" ")}` });
  }
  return { ok: true, id };
}

export type EsitoCambio =
  | { ok: true; aggiornati: number; invariati: number }
  | { ok: false; motivo: "non-trovato" | "vietato" | "non-valida"; messaggio: string };

// Cambio di stato validato. Idempotente: se il feedback è già nello stato
// richiesto non fa nulla (i workflow GitHub possono ripetere la chiamata).
// Con `issue_number` possono esserci più feedback (stessa issue): la
// transizione deve valere per tutti, altrimenti non ne cambia nessuno.
export async function cambiaStato(
  filtro: Filtro,
  a: FeedbackStato,
  autore: EventoAutore,
  extra: {
    testo?: string | null;
    tipoEvento?: EventoTipo;
    issue_number?: number;
    pr_number?: number;
  } = {}
): Promise<EsitoCambio> {
  const righe = await trova(filtro);
  if (righe.length === 0) return { ok: false, motivo: "non-trovato", messaggio: "Feedback non trovato." };

  const daCambiare = righe.filter((r) => r.stato !== a);
  for (const r of daCambiare) {
    const esito = verificaTransizione(r.stato, a, autore);
    if (!esito.ok) return esito;
  }

  const admin = createAdminClient();
  for (const r of righe) {
    const modifiche: Record<string, unknown> = {};
    if (extra.issue_number && "id" in filtro) modifiche.issue_number = extra.issue_number;
    if (extra.pr_number) modifiche.pr_number = extra.pr_number;
    const cambia = r.stato !== a;
    if (cambia) modifiche.stato = a;
    if (cambia && a === "riaperto") modifiche.riaperture = r.riaperture + 1;
    if (Object.keys(modifiche).length === 0) continue;

    // .eq("stato", r.stato): se nel frattempo qualcun altro l'ha cambiato,
    // questa scrittura non tocca nulla invece di saltare la matrice.
    const { data, error } = await admin
      .from("feedback")
      .update(modifiche)
      .eq("id", r.id)
      .eq("stato", r.stato)
      .select("id");
    if (error) throw error;
    if (!data?.length || !cambia) continue;
    await aggiungiEvento({
      feedback_id: r.id,
      autore,
      tipo: extra.tipoEvento ?? "cambio-stato",
      stato_da: r.stato,
      stato_a: a,
      testo: extra.testo ?? null,
    });
  }
  return { ok: true, aggiornati: daCambiare.length, invariati: righe.length - daCambiare.length };
}

// Nota-fix dell'agente (una frase per Lorenzo) o altro evento senza cambio
// di stato, cercando per id o per issue.
export async function aggiungiEventoA(filtro: Filtro, autore: EventoAutore, tipo: EventoTipo, testo: string) {
  const righe = await trova(filtro);
  for (const r of righe) await aggiungiEvento({ feedback_id: r.id, autore, tipo, testo });
  return righe.length;
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
  return (data ?? []) as FeedbackRow[];
}

export async function listaFeedback(): Promise<FeedbackRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("feedback").select("*").order("created_at", { ascending: false }).limit(300);
  if (error) throw error;
  return (data ?? []) as FeedbackRow[];
}

// Feedback con tutta la sua storia (note, risposte, nota-fix): quello che
// l'agente sviluppatore legge prima di lavorarci.
export async function feedbackCompleto(id: string): Promise<{ feedback: FeedbackRow; eventi: FeedbackEvento[] } | null> {
  const [feedback] = await trova({ id });
  if (!feedback) return null;
  return { feedback, eventi: await eventiFeedback(id) };
}

export type FeedbackBreve = Pick<FeedbackRow, "id" | "tipo" | "testo" | "stato" | "created_at" | "area">;

// "Qui hai già N segnalazioni aperte": feedback non chiusi sulla stessa route.
export async function feedbackApertiSuRoute(route: string): Promise<FeedbackBreve[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("feedback")
    .select("id, tipo, testo, stato, created_at, area")
    .eq("route", route)
    .not("stato", "in", "(verificato,scartato)")
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data ?? []) as FeedbackBreve[];
}

export type FeedbackDaVerificare = Pick<FeedbackRow, "id" | "route" | "url" | "punto" | "testo" | "tipo"> & {
  nota_fix: string | null;
};

// Per l'avviso "Avevi segnalato un problema qui. È sistemato?".
export async function feedbackDaVerificare(): Promise<FeedbackDaVerificare[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("feedback")
    .select("id, route, url, punto, testo, tipo")
    .eq("stato", "da-verificare")
    .order("updated_at", { ascending: true })
    .limit(20);
  if (error) throw error;
  const righe = (data ?? []) as Omit<FeedbackDaVerificare, "nota_fix">[];
  if (righe.length === 0) return [];
  const { data: note, error: errNote } = await admin
    .from("feedback_eventi")
    .select("feedback_id, testo, created_at")
    .eq("tipo", "nota-fix")
    .in(
      "feedback_id",
      righe.map((r) => r.id)
    )
    .order("created_at", { ascending: false });
  if (errNote) throw errNote;
  return righe.map((r) => ({
    ...r,
    nota_fix: (note ?? []).find((n) => n.feedback_id === r.id)?.testo ?? null,
  }));
}

// Feedback che aspettano Lorenzo (scheda "Per te" di /feedback, vedi
// lib/feedback/fasi.ts): una domanda, una PR da approvare, una verifica.
export async function contaPerTe(): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("feedback")
    .select("id", { count: "exact", head: true })
    .or("stato.in.(serve-info,da-verificare),and(stato.eq.in-lavorazione,pr_number.not.is.null)");
  if (error) throw error;
  return count ?? 0;
}

export async function eventiFeedback(id: string): Promise<FeedbackEvento[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("feedback_eventi")
    .select("*")
    .eq("feedback_id", id)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as FeedbackEvento[];
}

// Eventi di cambio stato verso verificato/riaperto: bastano per il
// riepilogo (tempo medio fino a verificato, tasso di riapertura).
export async function eventiChiusura(): Promise<Pick<FeedbackEvento, "feedback_id" | "stato_a" | "created_at">[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("feedback_eventi")
    .select("feedback_id, stato_a, created_at")
    .eq("tipo", "cambio-stato")
    .eq("stato_a", "verificato")
    .limit(1000);
  if (error) throw error;
  return data ?? [];
}

export type EventoDaRiportare = Pick<FeedbackEvento, "id" | "feedback_id" | "tipo" | "testo" | "created_at"> & {
  issue_number: number | null;
  stato: FeedbackStato;
};

// Note e risposte di Lorenzo non ancora riportate (parafrasate) nella
// issue dal job notturno.
export async function eventiDaRiportare(): Promise<EventoDaRiportare[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("feedback_eventi")
    .select("id, feedback_id, tipo, testo, created_at, feedback:feedback_id (issue_number, stato)")
    .eq("autore", "lorenzo")
    .in("tipo", ["nota", "risposta"])
    .is("riportato_at", null)
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) throw error;
  type Riga = Omit<EventoDaRiportare, "issue_number" | "stato"> & {
    feedback: { issue_number: number | null; stato: FeedbackStato } | null;
  };
  return ((data ?? []) as unknown as Riga[])
    .filter((r) => r.testo)
    .map(({ feedback, ...r }) => ({ ...r, issue_number: feedback?.issue_number ?? null, stato: feedback?.stato ?? "nuovo" }));
}

export async function segnaRiportati(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("feedback_eventi")
    .update({ riportato_at: new Date().toISOString() })
    .in("id", ids)
    .is("riportato_at", null)
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

// Il testo si può correggere solo finché nessun agente l'ha letto.
export async function modificaTesto(id: string, testo: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("feedback").update({ testo }).eq("id", id).eq("stato", "nuovo").select("id");
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}
