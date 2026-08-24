import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Esercizio,
  ImpegnoFisso,
  Scheda,
  SchedaEsercizioConNome,
  Sessione,
  SessioneLog,
  TipoMetrica,
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

export async function getSchede(opts?: { includeArchiviate?: boolean }): Promise<Scheda[]> {
  const admin = createAdminClient();
  let query = admin.from("schede").select("*").order("nome");
  if (!opts?.includeArchiviate) query = query.eq("is_archiviata", false);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export type SchedaConMeta = Scheda & {
  numBlocchi: number;
  numEsercizi: number;
  ultimoUtilizzo: string | null;
};

// Elenco per la pagina "Le mie schede" e per la selezione all'avvio
// allenamento: numero blocchi/esercizi e data ultimo utilizzo (max data tra
// le sessioni collegate) calcolati qui in JS, nessuna vista SQL dedicata
// (stesso principio di getUltimeSessioniConLog).
export async function getSchedeConMeta(opts?: { includeArchiviate?: boolean }): Promise<SchedaConMeta[]> {
  const admin = createAdminClient();
  const schede = await getSchede(opts);
  if (schede.length === 0) return [];

  const schedaIds = schede.map((s) => s.id);
  const [righeRes, sessioniRes] = await Promise.all([
    admin.from("scheda_esercizi").select("scheda_id, blocco").in("scheda_id", schedaIds),
    admin.from("sessioni").select("scheda_id, data").in("scheda_id", schedaIds),
  ]);
  if (righeRes.error) throw new Error(righeRes.error.message);
  if (sessioniRes.error) throw new Error(sessioniRes.error.message);

  const blocchiPerScheda = new Map<string, Set<string>>();
  const eserciziPerScheda = new Map<string, number>();
  for (const r of righeRes.data ?? []) {
    const schedaId = r.scheda_id as string;
    eserciziPerScheda.set(schedaId, (eserciziPerScheda.get(schedaId) ?? 0) + 1);
    const blocchi = blocchiPerScheda.get(schedaId) ?? new Set<string>();
    blocchi.add(r.blocco as string);
    blocchiPerScheda.set(schedaId, blocchi);
  }

  const ultimoUtilizzoPerScheda = new Map<string, string>();
  for (const s of sessioniRes.data ?? []) {
    const schedaId = s.scheda_id as string;
    const data = s.data as string;
    const attuale = ultimoUtilizzoPerScheda.get(schedaId);
    if (!attuale || data > attuale) ultimoUtilizzoPerScheda.set(schedaId, data);
  }

  return schede.map((scheda) => ({
    ...scheda,
    numBlocchi: blocchiPerScheda.get(scheda.id)?.size ?? 0,
    numEsercizi: eserciziPerScheda.get(scheda.id) ?? 0,
    ultimoUtilizzo: ultimoUtilizzoPerScheda.get(scheda.id) ?? null,
  }));
}

// Catalogo esercizi riusabile tra schede diverse (oggi solo "Full body
// casa"): l'editor di gestione scheda lo usa per proporre esercizi già
// esistenti invece di farne creare uno nuovo ogni volta.
export async function getEsercizi(): Promise<Esercizio[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("esercizi").select("*").order("nome");
  if (error) throw new Error(error.message);
  return data ?? [];
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
      attrezzatura: esercizio?.attrezzatura ?? null,
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
  // Snapshot per sessione (storicità): se la sessione ha uno snapshot, il
  // nome/metrica dell'esercizio per quella riga vengono da lì, non dal
  // catalogo/scheda live che potrebbe essere cambiato nel frattempo.
  const snapshotPerSessione = new Map<string, Map<string, SchedaEsercizioConNome>>();
  for (const s of sessioni) {
    if (!s.scheda_snapshot) continue;
    const righeSnapshot: SchedaEsercizioConNome[] = s.scheda_snapshot;
    snapshotPerSessione.set(s.id, new Map(righeSnapshot.map((r) => [r.id, r])));
  }

  const log: LogConNome[] = [];
  for (const row of logRes.data ?? []) {
    const snap = snapshotPerSessione.get(row.sessione_id)?.get(row.scheda_esercizio_id);
    if (snap) {
      log.push({
        sessione_id: row.sessione_id,
        esercizio_nome: snap.esercizio_nome,
        tipo_metrica: snap.tipo_metrica,
        rip_effettive: row.rip_effettive,
        peso_effettivo: toNumber(row.peso_effettivo),
        tempo_effettivo_sec: row.tempo_effettivo_sec,
      });
      continue;
    }
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

export type SessioneLogConNome = SessioneLog & {
  esercizio_nome: string;
  tipo_metrica: TipoMetrica;
  blocco: string;
  ordine: number;
};

// Dettaglio di una sessione passata (gestione storico): stesso join di
// getUltimeSessioniConLog ma per una sola sessione e con l'id di riga
// preservato, necessario per poter modificare/eliminare la singola serie.
// Risolve nome/blocco/ordine/metrica dallo snapshot della sessione quando
// presente (storicità: una scheda modificata dopo non altera sessioni già
// registrate), col join live come fallback per le sessioni pre-snapshot.
export async function getLogPerSessioneConNome(sessione: Sessione): Promise<SessioneLogConNome[]> {
  const admin = createAdminClient();
  const snapshotMap = new Map((sessione.scheda_snapshot ?? []).map((r) => [r.id, r]));

  const [logRes, schedaEsRes, eserciziRes] = await Promise.all([
    admin.from("sessioni_log").select("*").eq("sessione_id", sessione.id),
    snapshotMap.size > 0
      ? Promise.resolve({ data: [], error: null })
      : admin.from("scheda_esercizi").select("id, esercizio_id, blocco, ordine"),
    snapshotMap.size > 0
      ? Promise.resolve({ data: [], error: null })
      : admin.from("esercizi").select("id, nome, tipo_metrica"),
  ]);
  if (logRes.error) throw new Error(logRes.error.message);
  if (schedaEsRes.error) throw new Error(schedaEsRes.error.message);
  if (eserciziRes.error) throw new Error(eserciziRes.error.message);

  const schedaEsMap = new Map(
    (schedaEsRes.data ?? []).map((r) => [
      r.id as string,
      r as { esercizio_id: string; blocco: string; ordine: number },
    ])
  );
  const eserciziMap = new Map(
    (eserciziRes.data ?? []).map((e) => [e.id as string, e as { nome: string; tipo_metrica: string }])
  );

  const righe = (logRes.data ?? []).map((row) => {
    const snap = snapshotMap.get(row.scheda_esercizio_id);
    if (snap) {
      return {
        id: row.id,
        sessione_id: row.sessione_id,
        scheda_esercizio_id: row.scheda_esercizio_id,
        serie_effettive: row.serie_effettive,
        rip_effettive: row.rip_effettive,
        peso_effettivo: toNumber(row.peso_effettivo),
        tempo_effettivo_sec: row.tempo_effettivo_sec,
        esercizio_nome: snap.esercizio_nome,
        tipo_metrica: snap.tipo_metrica,
        blocco: snap.blocco,
        ordine: snap.ordine,
      };
    }
    const schedaEs = schedaEsMap.get(row.scheda_esercizio_id);
    const esercizio = schedaEs ? eserciziMap.get(schedaEs.esercizio_id) : undefined;
    return {
      id: row.id,
      sessione_id: row.sessione_id,
      scheda_esercizio_id: row.scheda_esercizio_id,
      serie_effettive: row.serie_effettive,
      rip_effettive: row.rip_effettive,
      peso_effettivo: toNumber(row.peso_effettivo),
      tempo_effettivo_sec: row.tempo_effettivo_sec,
      esercizio_nome: esercizio?.nome ?? "Esercizio",
      tipo_metrica: (esercizio?.tipo_metrica as TipoMetrica) ?? "serie_rip",
      blocco: schedaEs?.blocco ?? "",
      ordine: schedaEs?.ordine ?? 0,
    };
  });

  // Stesso ordine della scheda (non l'ordine di inserimento in DB, che non è
  // garantito): riflette la sequenza reale dell'allenamento svolto.
  righe.sort((a, b) => a.ordine - b.ordine);
  return righe;
}
