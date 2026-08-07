export type CategoriaEvento = "ferie" | "visita" | "scadenza" | "personale" | "altro";
export type SourceEvento = "manuale" | "google_sync";
export type SyncStatus = "synced" | "pending_push" | "conflict";
export type StatoIntegrazione = "non_connesso" | "connesso" | "scaduto";

export type Evento = {
  id: string;
  titolo: string;
  descrizione: string | null;
  luogo: string | null;
  data_inizio: string;
  data_fine: string;
  tutto_il_giorno: boolean;
  categoria: CategoriaEvento;
  google_event_id: string | null;
  source: SourceEvento;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
};

export type NotaGiorno = {
  id: string;
  data: string;
  contenuto: string;
  updated_at: string;
};

export type IntegrazioneGoogle = {
  id: string;
  refresh_token_enc: string | null;
  access_token: string | null;
  access_token_scadenza: string | null;
  calendar_sync_token: string | null;
  ultimo_sync: string | null;
  stato: StatoIntegrazione;
  created_at: string;
};

export type MailGiorno = {
  id: string;
  da: string;
  a: string;
  oggetto: string;
  snippet: string;
  data: string;
  direzione: "ricevuta" | "inviata";
};
