import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Esercizio,
  ImpegnoFisso,
  Scheda,
  SchedaEsercizioConNome,
  Sessione,
  SessioneLog,
} from "./types";

function toNumber(v: unknown): number | null {
  return v === null || v === undefined ? null : Number(v);
}

export async function getImpegniFissi(): Promise<ImpegnoFisso[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("impegni_fissi")
    .select("*")
    .order("giorno_settimana");
  if (error) throw new Error(error.message);
  return data ?? [];
}

// La scheda "Full body casa" non è legata a un giorno fisso: si avvia da un
// pulsante sempre visibile, non da una cella della griglia settimanale.
export async function getSchedaFullBodyCasa(): Promise<Scheda | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("schede")
    .select("*")
    .eq("nome", "Full body casa")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function getScheda(schedaId: string): Promise<Scheda | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("schede").select("*").eq("id", schedaId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

// Righe ordinate per `ordine` (sequenza globale sulla scheda, non per
// blocco: vedi nota nella migration 016) con nome/tipo_metrica
// dell'esercizio già uniti, per non fare N query separate in UI.
export async function getSchedaEsercizi(schedaId: string): Promise<SchedaEsercizioConNome[]> {
  const admin = createAdminClient();
  const [scheEsRes, eserciziRes] = await Promise.all([
    admin.from("scheda_esercizi").select("*").eq("scheda_id", schedaId).order("ordine"),
    admin.from("esercizi").select("*"),
  ]);
  if (scheEsRes.error) throw new Error(scheEsRes.error.message);
  if (eserciziRes.error) throw new Error(eserciziRes.error.message);

  const eserciziMap = new Map<string, Esercizio>((eserciziRes.data ?? []).map((e) => [e.id, e]));

  return (scheEsRes.data ?? []).map((row) => {
    const esercizio = eserciziMap.get(row.esercizio_id);
    return {
      ...row,
      target_peso: toNumber(row.target_peso),
      esercizio_nome: esercizio?.nome ?? "Esercizio",
      tipo_metrica: esercizio?.tipo_metrica ?? "serie_rip",
    };
  });
}

// Niente `.order()` su una colonna della risorsa annidata (supporto
// PostgREST incerto lato client JS): il volume per esercizio è piccolo,
// si ordina in JS come altrove nel progetto (pivot lato TypeScript, non SQL).
export async function getUltimoLogPerSchedaEsercizio(
  schedaEsercizioId: string,
  sessioneEsclusa?: string
): Promise<SessioneLog | null> {
  const admin = createAdminClient();
  let query = admin
    .from("sessioni_log")
    .select("*, sessioni!inner(data)")
    .eq("scheda_esercizio_id", schedaEsercizioId);
  if (sessioneEsclusa) query = query.neq("sessione_id", sessioneEsclusa);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return null;

  const righe = data as unknown as (SessioneLog & { sessioni: { data: string } })[];
  righe.sort((a, b) => (a.sessioni.data < b.sessioni.data ? 1 : -1));
  const ultimo = righe[0];
  return {
    id: ultimo.id,
    sessione_id: ultimo.sessione_id,
    scheda_esercizio_id: ultimo.scheda_esercizio_id,
    serie_effettive: ultimo.serie_effettive,
    rip_effettive: ultimo.rip_effettive,
    peso_effettivo: toNumber(ultimo.peso_effettivo),
    tempo_effettivo_sec: ultimo.tempo_effettivo_sec,
  };
}

export async function getSessioni(): Promise<Sessione[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("sessioni").select("*").order("data", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getSessione(id: string): Promise<Sessione | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("sessioni").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

export type LogConNome = {
  sessione_id: string;
  esercizio_nome: string;
  tipo_metrica: import("./types").TipoMetrica;
  rip_effettive: number | null;
  peso_effettivo: number | null;
  tempo_effettivo_sec: number | null;
};

// Niente vista dedicata: sessioni/log/scheda_esercizi/esercizi restano le
// uniche fonti, il join nome-esercizio -> log si fa qui in JS (volume
// ridotto, più semplice da far evolvere quando cambiano le colonne della
// tabella progressi rispetto a mantenere una vista SQL).
export async function getUltimeSessioniConLog(
  limit = 30
): Promise<{ sessioni: Sessione[]; log: LogConNome[] }> {
  const admin = createAdminClient();
  const { data: sessioniData, error: sessioniErr } = await admin
    .from("sessioni")
    .select("*")
    .order("data", { ascending: false })
    .limit(limit);
  if (sessioniErr) throw new Error(sessioniErr.message);

  const sessioni = sessioniData ?? [];
  if (sessioni.length === 0) return { sessioni: [], log: [] };

  const ids = sessioni.map((s) => s.id);
  const [logRes, schedaEsRes, eserciziRes] = await Promise.all([
    admin.from("sessioni_log").select("*").in("sessione_id", ids),
    admin.from("scheda_esercizi").select("id, esercizio_id"),
    admin.from("esercizi").select("id, nome, tipo_metrica"),
  ]);
  if (logRes.error) throw new Error(logRes.error.message);
  if (schedaEsRes.error) throw new Error(schedaEsRes.error.message);
  if (eserciziRes.error) throw new Error(eserciziRes.error.message);

  const schedaEsercizioToEsercizio = new Map<string, string>(
    (schedaEsRes.data ?? []).map((r) => [r.id as string, r.esercizio_id as string])
  );
  const eserciziMap = new Map<string, { nome: string; tipo_metrica: string }>(
    (eserciziRes.data ?? []).map((e) => [e.id as string, { nome: e.nome, tipo_metrica: e.tipo_metrica }])
  );

  const log: LogConNome[] = [];
  for (const row of logRes.data ?? []) {
    const esercizioId = schedaEsercizioToEsercizio.get(row.scheda_esercizio_id);
    const esercizio = esercizioId ? eserciziMap.get(esercizioId) : undefined;
    if (!esercizio) continue;
    log.push({
      sessione_id: row.sessione_id,
      esercizio_nome: esercizio.nome,
      tipo_metrica: esercizio.tipo_metrica as LogConNome["tipo_metrica"],
      rip_effettive: row.rip_effettive,
      peso_effettivo: toNumber(row.peso_effettivo),
      tempo_effettivo_sec: row.tempo_effettivo_sec,
    });
  }

  return { sessioni, log };
}

export async function getLogPerSessione(sessioneId: string): Promise<SessioneLog[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("sessioni_log")
    .select("*")
    .eq("sessione_id", sessioneId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({ ...row, peso_effettivo: toNumber(row.peso_effettivo) }));
}
