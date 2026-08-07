-- Migrazione 017: modulo Agenda.
-- Tre tabelle: eventi (master locale, sincronizzati con Google Calendar),
-- note_giorno (una nota di testo libero per data), integrazione_google
-- (riga singola con i token OAuth cifrati e lo stato di sync).
-- Stessa convenzione delle altre tabelle: RLS abilitata senza policy per
-- anon/authenticated, l'app legge/scrive sempre lato server con la service
-- role key (bypassa RLS). Vedi supabase/006_investimenti.sql.

create table if not exists eventi (
  id uuid primary key default gen_random_uuid(),
  titolo text not null,
  descrizione text,
  luogo text,
  data_inizio timestamptz not null,
  data_fine timestamptz not null,
  tutto_il_giorno boolean not null default false,
  categoria text not null default 'personale'
    check (categoria in ('ferie', 'visita', 'scadenza', 'personale', 'altro')),
  google_event_id text unique,
  source text not null default 'manuale'
    check (source in ('manuale', 'google_sync')),
  sync_status text not null default 'pending_push'
    check (sync_status in ('synced', 'pending_push', 'conflict')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists eventi_data_inizio_idx on eventi (data_inizio);
create index if not exists eventi_google_event_id_idx on eventi (google_event_id);

create table if not exists note_giorno (
  id uuid primary key default gen_random_uuid(),
  data date not null unique,
  contenuto text not null default '',
  updated_at timestamptz not null default now()
);

-- Riga singola: un solo utente, un solo set di credenziali Google.
create table if not exists integrazione_google (
  id uuid primary key default gen_random_uuid(),
  refresh_token_enc text,
  access_token text,
  access_token_scadenza timestamptz,
  calendar_sync_token text,
  ultimo_sync timestamptz,
  stato text not null default 'non_connesso'
    check (stato in ('non_connesso', 'connesso', 'scaduto')),
  created_at timestamptz not null default now()
);

alter table eventi enable row level security;
alter table note_giorno enable row level security;
alter table integrazione_google enable row level security;

-- Trigger per aggiornare updated_at automaticamente sugli eventi
-- (serve per il last-write-wins nel conflict resolution della sync).
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists eventi_set_updated_at on eventi;
create trigger eventi_set_updated_at
  before update on eventi
  for each row execute function set_updated_at();
