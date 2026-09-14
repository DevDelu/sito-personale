import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AderenzaPasto, Alimento, ComposizioneItem, Pasto, TemplatePasto, TipoPasto } from "./types";

function toNumber(v: unknown): number {
  return v === null || v === undefined ? 0 : Number(v);
}

function mapComposizione(raw: unknown): ComposizioneItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
    .map((r) => ({ alimento_id: String(r.alimento_id ?? ""), quantita_g: toNumber(r.quantita_g) }))
    .filter((r) => r.alimento_id);
}

function mapTemplateRow(row: Record<string, unknown>): TemplatePasto {
  return {
    id: row.id as string,
    giorno_settimana: Number(row.giorno_settimana),
    tipo_pasto: row.tipo_pasto as TipoPasto,
    nome: row.nome as string,
    composizione: mapComposizione(row.composizione),
    note: (row.note as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function getTemplatePasti(): Promise<TemplatePasto[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("template_pasti")
    .select("*")
    .order("giorno_settimana")
    .order("tipo_pasto");
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapTemplateRow);
}

export async function getTemplateForGiorno(
  giorno: number,
  tipoPasto: TipoPasto
): Promise<TemplatePasto | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("template_pasti")
    .select("*")
    .eq("giorno_settimana", giorno)
    .eq("tipo_pasto", tipoPasto)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapTemplateRow(data) : null;
}

export async function creaTemplate(input: {
  giornoSettimana: number;
  tipoPasto: TipoPasto;
  nome: string;
  composizione: ComposizioneItem[];
  note?: string | null;
}): Promise<TemplatePasto> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("template_pasti")
    .insert({
      giorno_settimana: input.giornoSettimana,
      tipo_pasto: input.tipoPasto,
      nome: input.nome,
      composizione: input.composizione,
      note: input.note || null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapTemplateRow(data);
}

export async function aggiornaTemplate(
  id: string,
  patch: {
    nome?: string;
    composizione?: ComposizioneItem[];
    note?: string | null;
  }
): Promise<void> {
  const admin = createAdminClient();

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.nome !== undefined) update.nome = patch.nome;
  if (patch.composizione !== undefined) update.composizione = patch.composizione;
  if (patch.note !== undefined) update.note = patch.note || null;

  const { error } = await admin.from("template_pasti").update(update).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function eliminaTemplate(id: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("template_pasti").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// Giorno della settimana 1 (lunedì) .. 7 (domenica) per una data ISO
// (getDay() di JS usa 0 = domenica, va rimappato).
export function giornoSettimanaDaData(dataIso: string): number {
  const giorno = new Date(`${dataIso}T00:00:00Z`).getUTCDay();
  return giorno === 0 ? 7 : giorno;
}

// Aderenza al piano per un singolo pasto (data + tipo_pasto): confronta i
// pasti realmente loggati con la composizione del template del giorno.
// Calcolata in TypeScript, non con una vista SQL — stesso principio di
// getRiepilogoTdee/trendSettimanale in lib/alimentazione/queries.ts (vedi
// commento in supabase/026_alimentazione.sql).
export function calcolaAderenzaPasto(
  template: TemplatePasto | null | undefined,
  pastiLoggati: Pasto[],
  alimenti: Alimento[]
): AderenzaPasto {
  if (!template || template.composizione.length === 0) return { ok: false };

  const alimentiById = new Map(alimenti.map((a) => [a.id, a]));
  const alimentiTemplateIds = new Set(template.composizione.map((c) => c.alimento_id));

  let sommaPesata = 0;
  let sommaPesi = 0;
  let sommaSemplice = 0;

  for (const item of template.composizione) {
    const grammiReali = pastiLoggati
      .filter((p) => p.alimento_id === item.alimento_id)
      .reduce((acc, p) => acc + p.quantita_g, 0);

    const aderenzaAlimento =
      item.quantita_g > 0 ? 1 - Math.min(1, Math.abs(grammiReali - item.quantita_g) / item.quantita_g) : 1;

    const alimento = alimentiById.get(item.alimento_id);
    const peso = alimento ? (item.quantita_g / 100) * alimento.kcal_100g : 0;

    sommaPesata += aderenzaAlimento * peso;
    sommaPesi += peso;
    sommaSemplice += aderenzaAlimento;
  }

  const aderenza = sommaPesi > 0 ? sommaPesata / sommaPesi : sommaSemplice / template.composizione.length;

  const fuoriPiano = pastiLoggati
    .filter((p) => !p.alimento_id || !alimentiTemplateIds.has(p.alimento_id))
    .map((p) => p.alimento_nome);

  return { ok: true, templateNome: template.nome, aderenza, fuoriPiano };
}

// Media dell'aderenza su un periodo: raggruppa i pasti realmente loggati per
// data+tipo_pasto, calcola l'aderenza di ogni gruppo applicabile (template
// esistente e non vuoto) e ne fa la media. null se nel periodo non c'è
// nessun pasto/gruppo applicabile (nessun template configurato, o nessun
// pasto loggato) — stesso principio di "non calcolabile" di RiepilogoTdee.
export function aderenzaMedia(
  pasti: Pasto[],
  templates: TemplatePasto[],
  alimenti: Alimento[],
  from: string,
  to: string
): number | null {
  const pastiNelPeriodo = pasti.filter((p) => p.data >= from && p.data <= to);
  if (pastiNelPeriodo.length === 0) return null;

  const gruppi = new Map<string, Pasto[]>();
  for (const p of pastiNelPeriodo) {
    const chiave = `${p.data}|${p.tipo_pasto}`;
    const gruppo = gruppi.get(chiave);
    if (gruppo) gruppo.push(p);
    else gruppi.set(chiave, [p]);
  }

  const templatesByChiave = new Map(templates.map((t) => [`${t.giorno_settimana}|${t.tipo_pasto}`, t]));

  const valori: number[] = [];
  for (const [chiave, pastiGruppo] of gruppi) {
    const [data, tipoPasto] = chiave.split("|");
    const giorno = giornoSettimanaDaData(data);
    const template = templatesByChiave.get(`${giorno}|${tipoPasto}`);
    const risultato = calcolaAderenzaPasto(template, pastiGruppo, alimenti);
    if (risultato.ok) valori.push(risultato.aderenza);
  }

  if (valori.length === 0) return null;
  return valori.reduce((acc, v) => acc + v, 0) / valori.length;
}

// Inserisce un Pasto reale per ogni voce della composizione del template
// (loop su creaPasto, stesso snapshot kcal/macro dell'inserimento singolo):
// usato dal quick-add "Registra pasto da template".
export async function registraPastoDaTemplate(input: {
  data: string;
  tipoPasto: TipoPasto;
  composizione: ComposizioneItem[];
}): Promise<void> {
  const { creaPasto } = await import("./queries");
  for (const item of input.composizione) {
    await creaPasto({
      data: input.data,
      tipoPasto: input.tipoPasto,
      alimentoId: item.alimento_id,
      quantitaG: item.quantita_g,
    });
  }
}
