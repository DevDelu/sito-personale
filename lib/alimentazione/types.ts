export type TipoPasto = "colazione" | "pranzo" | "cena" | "spuntino";
export type Sesso = "M" | "F";
export type LivelloAttivita = "sedentario" | "leggero" | "moderato" | "attivo" | "molto_attivo";
export type FaseObiettivo = "mantenimento" | "surplus" | "deficit";

export type Alimento = {
  id: string;
  nome: string;
  kcal_100g: number;
  proteine_100g: number;
  carboidrati_100g: number;
  grassi_100g: number;
  created_at: string;
};

// kcal/proteine_g/carboidrati_g/grassi_g sono uno snapshot calcolato
// all'insert (vedi commento in supabase/026_alimentazione.sql): non vanno
// mai ricalcolati da un join a `alimenti`.
export type Pasto = {
  id: string;
  data: string;
  tipo_pasto: TipoPasto;
  alimento_id: string | null;
  alimento_nome: string;
  quantita_g: number;
  kcal: number;
  proteine_g: number;
  carboidrati_g: number;
  grassi_g: number;
  note: string | null;
  created_at: string;
};

export type PesoCorporeo = {
  id: string;
  data: string;
  peso_kg: number;
  note: string | null;
  created_at: string;
};

export type ProfiloNutrizionale = {
  id: string;
  altezza_cm: number | null;
  eta: number | null;
  sesso: Sesso | null;
  livello_attivita: LivelloAttivita;
  fase_obiettivo: FaseObiettivo;
  percentuale_fase: number;
  updated_at: string;
};

export type ComposizioneItem = { alimento_id: string; quantita_g: number };

export type TemplatePasto = {
  id: string;
  giorno_settimana: number; // 1 = lunedì .. 7 = domenica
  tipo_pasto: TipoPasto;
  nome: string;
  composizione: ComposizioneItem[];
  note: string | null;
  created_at: string;
  updated_at: string;
};

// Aderenza non calcolabile (nessun template per quel giorno/tipo pasto, o
// template con composizione vuota) è un caso normale, non un errore — stesso
// principio di RiepilogoTdee.
export type AderenzaPasto =
  | { ok: false }
  | {
      ok: true;
      templateNome: string;
      aderenza: number; // 0..1
      fuoriPiano: string[]; // nomi di alimenti loggati non previsti dal template
    };

export type MacroTotali = {
  kcal: number;
  proteine_g: number;
  carboidrati_g: number;
  grassi_g: number;
};

// TDEE non calcolabile (peso mancante) è un caso normale, non un errore: la
// Overview mostra un prompt "inserisci il peso" invece di un numero.
export type RiepilogoTdee =
  | { ok: false; motivo: "peso_mancante" | "profilo_incompleto" }
  | {
      ok: true;
      bmr: number;
      tdee: number;
      targetKcal: number;
      pesoKg: number;
      pesoData: string;
    };
