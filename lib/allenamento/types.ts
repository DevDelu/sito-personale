export type TipoMetrica = "serie_rip" | "serie_rip_peso" | "tempo";
export type TipoRiga = "normale" | "circuito" | "stretching";

export type ImpegnoFisso = {
  id: string;
  giorno_settimana: number; // 0 = lunedì .. 6 = domenica
  titolo: string;
  orario: string | null;
  note: string | null;
  attivo: boolean;
};

export type Esercizio = {
  id: string;
  nome: string;
  tipo_metrica: TipoMetrica;
  note: string | null;
};

export type Scheda = {
  id: string;
  nome: string;
  descrizione: string | null;
};

export type SchedaEsercizio = {
  id: string;
  scheda_id: string;
  esercizio_id: string;
  blocco: string;
  ordine: number;
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

export type SchedaEsercizioConNome = SchedaEsercizio & {
  esercizio_nome: string;
  tipo_metrica: TipoMetrica;
};

export type Sessione = {
  id: string;
  data: string;
  scheda_id: string | null;
  durata_min: number | null;
  sensazione: number | null;
  note: string | null;
};

export type SessioneLog = {
  id: string;
  sessione_id: string;
  scheda_esercizio_id: string;
  serie_effettive: number | null;
  rip_effettive: number | null;
  peso_effettivo: number | null;
  tempo_effettivo_sec: number | null;
};
