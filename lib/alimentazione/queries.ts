import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Alimento,
  FaseObiettivo,
  LivelloAttivita,
  MacroTotali,
  Pasto,
  PesoCorporeo,
  ProfiloNutrizionale,
  RiepilogoTdee,
  TipoPasto,
} from "./types";

function toNumber(v: unknown): number {
  return v === null || v === undefined ? 0 : Number(v);
}

function toNumberOrNull(v: unknown): number | null {
  return v === null || v === undefined ? null : Number(v);
}

// Fattore di attività per il calcolo del TDEE (Mifflin-St Jeor × fattore).
const FATTORE_ATTIVITA: Record<LivelloAttivita, number> = {
  sedentario: 1.2,
  leggero: 1.375,
  moderato: 1.55,
  attivo: 1.725,
  molto_attivo: 1.9,
};

export async function getAlimenti(): Promise<Alimento[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("alimenti").select("*").order("nome");
  if (error) throw new Error(error.message);
  return (data ?? []).map((a) => ({
    ...a,
    kcal_100g: toNumber(a.kcal_100g),
    proteine_100g: toNumber(a.proteine_100g),
    carboidrati_100g: toNumber(a.carboidrati_100g),
    grassi_100g: toNumber(a.grassi_100g),
  }));
}

export async function getAlimento(id: string): Promise<Alimento | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("alimenti").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    ...data,
    kcal_100g: toNumber(data.kcal_100g),
    proteine_100g: toNumber(data.proteine_100g),
    carboidrati_100g: toNumber(data.carboidrati_100g),
    grassi_100g: toNumber(data.grassi_100g),
  };
}

export type PastiFiltri = {
  from?: string;
  to?: string;
  tipoPasto?: TipoPasto;
  page: number;
  pageSize: number;
};

export async function getPasti(filtri: PastiFiltri): Promise<{ rows: Pasto[]; total: number }> {
  const admin = createAdminClient();
  const offset = (filtri.page - 1) * filtri.pageSize;

  let query = admin
    .from("pasti")
    .select("*", { count: "exact" })
    .order("data", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + filtri.pageSize - 1);

  if (filtri.from) query = query.gte("data", filtri.from);
  if (filtri.to) query = query.lte("data", filtri.to);
  if (filtri.tipoPasto) query = query.eq("tipo_pasto", filtri.tipoPasto);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    rows: (data ?? []).map(mapPastoRow),
    total: count ?? 0,
  };
}

export async function getPastiByData(data: string): Promise<Pasto[]> {
  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("pasti")
    .select("*")
    .eq("data", data)
    .order("created_at");
  if (error) throw new Error(error.message);
  return (rows ?? []).map(mapPastoRow);
}

export async function getPastiTraDate(from: string, to: string): Promise<Pasto[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pasti")
    .select("*")
    .gte("data", from)
    .lte("data", to)
    .order("data");
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapPastoRow);
}

function mapPastoRow(row: Record<string, unknown>): Pasto {
  return {
    id: row.id as string,
    data: row.data as string,
    tipo_pasto: row.tipo_pasto as TipoPasto,
    alimento_id: (row.alimento_id as string | null) ?? null,
    alimento_nome: row.alimento_nome as string,
    quantita_g: toNumber(row.quantita_g),
    kcal: toNumber(row.kcal),
    proteine_g: toNumber(row.proteine_g),
    carboidrati_g: toNumber(row.carboidrati_g),
    grassi_g: toNumber(row.grassi_g),
    note: (row.note as string | null) ?? null,
    created_at: row.created_at as string,
  };
}

// Calcola lo snapshot kcal/macro dai valori/100g dell'alimento AL MOMENTO
// dell'inserimento: mai un join a `alimenti` a lettura, coerente con
// `sessioni_log` (016_allenamento.sql) che non viene mai ricalcolata se la
// scheda cambia dopo.
export async function creaPasto(input: {
  data: string;
  tipoPasto: TipoPasto;
  alimentoId: string;
  quantitaG: number;
  note?: string | null;
}): Promise<Pasto> {
  const alimento = await getAlimento(input.alimentoId);
  if (!alimento) throw new Error("Alimento non trovato.");

  const fattore = input.quantitaG / 100;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pasti")
    .insert({
      data: input.data,
      tipo_pasto: input.tipoPasto,
      alimento_id: alimento.id,
      alimento_nome: alimento.nome,
      quantita_g: input.quantitaG,
      kcal: round1(alimento.kcal_100g * fattore),
      proteine_g: round1(alimento.proteine_100g * fattore),
      carboidrati_g: round1(alimento.carboidrati_100g * fattore),
      grassi_g: round1(alimento.grassi_100g * fattore),
      note: input.note || null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapPastoRow(data);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export async function eliminaPasto(id: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("pasti").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function aggiornaPasto(
  id: string,
  patch: { data?: string; tipoPasto?: TipoPasto; quantitaG?: number; note?: string | null }
): Promise<void> {
  const admin = createAdminClient();

  const update: Record<string, unknown> = {};
  if (patch.data) update.data = patch.data;
  if (patch.tipoPasto) update.tipo_pasto = patch.tipoPasto;
  if (patch.note !== undefined) update.note = patch.note || null;

  // Cambiare la quantità ricalcola lo snapshot in proporzione ai valori già
  // salvati sulla riga (non un nuovo join a `alimenti`): la correzione
  // resta coerente con l'alimento scelto in origine, senza reintrodurre una
  // dipendenza dal catalogo corrente.
  if (patch.quantitaG !== undefined) {
    const { data: attuale, error: fetchError } = await admin
      .from("pasti")
      .select("quantita_g, kcal, proteine_g, carboidrati_g, grassi_g")
      .eq("id", id)
      .single();
    if (fetchError) throw new Error(fetchError.message);

    const quantitaAttuale = toNumber(attuale.quantita_g);
    if (quantitaAttuale <= 0) throw new Error("Quantità originale non valida.");
    const rapporto = patch.quantitaG / quantitaAttuale;

    update.quantita_g = patch.quantitaG;
    update.kcal = round1(toNumber(attuale.kcal) * rapporto);
    update.proteine_g = round1(toNumber(attuale.proteine_g) * rapporto);
    update.carboidrati_g = round1(toNumber(attuale.carboidrati_g) * rapporto);
    update.grassi_g = round1(toNumber(attuale.grassi_g) * rapporto);
  }

  if (Object.keys(update).length === 0) return;

  const { error } = await admin.from("pasti").update(update).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function creaAlimento(input: {
  nome: string;
  kcal100g: number;
  proteine100g: number;
  carboidrati100g: number;
  grassi100g: number;
}): Promise<Alimento> {
  const admin = createAdminClient();

  const { data: esistente } = await admin
    .from("alimenti")
    .select("*")
    .ilike("nome", input.nome)
    .maybeSingle();
  if (esistente) {
    return {
      ...esistente,
      kcal_100g: toNumber(esistente.kcal_100g),
      proteine_100g: toNumber(esistente.proteine_100g),
      carboidrati_100g: toNumber(esistente.carboidrati_100g),
      grassi_100g: toNumber(esistente.grassi_100g),
    };
  }

  const { data, error } = await admin
    .from("alimenti")
    .insert({
      nome: input.nome,
      kcal_100g: input.kcal100g,
      proteine_100g: input.proteine100g,
      carboidrati_100g: input.carboidrati100g,
      grassi_100g: input.grassi100g,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return {
    ...data,
    kcal_100g: toNumber(data.kcal_100g),
    proteine_100g: toNumber(data.proteine_100g),
    carboidrati_100g: toNumber(data.carboidrati_100g),
    grassi_100g: toNumber(data.grassi_100g),
  };
}

export async function getPesoCorporeo(): Promise<PesoCorporeo[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("peso_corporeo")
    .select("*")
    .order("data", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => ({ ...p, peso_kg: toNumber(p.peso_kg) }));
}

async function getUltimoPeso(): Promise<PesoCorporeo | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("peso_corporeo")
    .select("*")
    .order("data", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return { ...data, peso_kg: toNumber(data.peso_kg) };
}

// Upsert per data: un solo peso al giorno (vincolo unique in DB), ripetere
// la stessa data corregge il valore invece di duplicare la riga.
export async function registraPeso(input: { data: string; pesoKg: number; note?: string | null }): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("peso_corporeo")
    .upsert({ data: input.data, peso_kg: input.pesoKg, note: input.note || null }, { onConflict: "data" });
  if (error) throw new Error(error.message);
}

export async function eliminaPeso(id: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("peso_corporeo").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getProfilo(): Promise<ProfiloNutrizionale | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profilo_nutrizionale")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    ...data,
    altezza_cm: toNumberOrNull(data.altezza_cm),
    eta: data.eta === null ? null : Number(data.eta),
    percentuale_fase: toNumber(data.percentuale_fase),
  };
}

// Singleton: aggiorna la riga esistente se c'è già un profilo, altrimenti ne
// crea la prima (mai più di una riga, vedi commento in
// supabase/026_alimentazione.sql).
export async function salvaProfilo(input: {
  altezzaCm: number;
  eta: number;
  sesso: "M" | "F";
  livelloAttivita: LivelloAttivita;
  faseObiettivo: FaseObiettivo;
  percentualeFase: number;
}): Promise<void> {
  const admin = createAdminClient();
  const esistente = await getProfilo();

  const payload = {
    altezza_cm: input.altezzaCm,
    eta: input.eta,
    sesso: input.sesso,
    livello_attivita: input.livelloAttivita,
    fase_obiettivo: input.faseObiettivo,
    percentuale_fase: input.faseObiettivo === "mantenimento" ? 0 : input.percentualeFase,
    updated_at: new Date().toISOString(),
  };

  if (esistente) {
    const { error } = await admin.from("profilo_nutrizionale").update(payload).eq("id", esistente.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin.from("profilo_nutrizionale").insert(payload);
    if (error) throw new Error(error.message);
  }
}

// BMR (Mifflin-St Jeor) + TDEE + target kcal di fase: calcolati in
// TypeScript, non con una vista SQL — stesso principio del costo-base FIFO
// in lib/investimenti/fifo.ts (nessuna vista SQL nel repo copre logica con
// più di un semplice join). Ritorna un risultato "non calcolabile" esplicito
// quando manca il peso o il profilo, invece di lanciare: la Overview lo usa
// per mostrare un prompt invece di un numero.
export async function getRiepilogoTdee(): Promise<RiepilogoTdee> {
  const [profilo, peso] = await Promise.all([getProfilo(), getUltimoPeso()]);

  if (!profilo || !profilo.altezza_cm || !profilo.eta || !profilo.sesso) {
    return { ok: false, motivo: "profilo_incompleto" };
  }
  if (!peso) {
    return { ok: false, motivo: "peso_mancante" };
  }

  const base = 10 * peso.peso_kg + 6.25 * profilo.altezza_cm - 5 * profilo.eta;
  const bmr = profilo.sesso === "M" ? base + 5 : base - 161;
  const tdee = bmr * FATTORE_ATTIVITA[profilo.livello_attivita];

  let targetKcal = tdee;
  if (profilo.fase_obiettivo === "surplus") targetKcal = tdee * (1 + profilo.percentuale_fase / 100);
  if (profilo.fase_obiettivo === "deficit") targetKcal = tdee * (1 - profilo.percentuale_fase / 100);

  return {
    ok: true,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetKcal: Math.round(targetKcal),
    pesoKg: peso.peso_kg,
    pesoData: peso.data,
  };
}

export function sommaMacro(pasti: Pasto[]): MacroTotali {
  return pasti.reduce(
    (acc, p) => ({
      kcal: acc.kcal + p.kcal,
      proteine_g: acc.proteine_g + p.proteine_g,
      carboidrati_g: acc.carboidrati_g + p.carboidrati_g,
      grassi_g: acc.grassi_g + p.grassi_g,
    }),
    { kcal: 0, proteine_g: 0, carboidrati_g: 0, grassi_g: 0 }
  );
}

export type PuntoTrendGiornaliero = { data: string; label: string; kcal: number };

// Ultimi 7 giorni (oggi incluso), un punto per giorno anche se nessun pasto
// è stato loggato (kcal 0): stesso principio di dailyFlow in
// components/spese/DailyTrendChart.tsx, che riempie i giorni senza dati
// invece di saltarli, per un asse X continuo.
export function trendSettimanale(pasti: Pasto[], oggiIso: string): PuntoTrendGiornaliero[] {
  const perGiorno = new Map<string, number>();
  for (const p of pasti) perGiorno.set(p.data, (perGiorno.get(p.data) ?? 0) + p.kcal);

  const punti: PuntoTrendGiornaliero[] = [];
  const oggi = new Date(`${oggiIso}T00:00:00Z`);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(oggi.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    punti.push({
      data: key,
      label: d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }),
      kcal: Math.round(perGiorno.get(key) ?? 0),
    });
  }
  return punti;
}
