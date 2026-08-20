-- Migrazione 019: multi-scheda ("Le mie schede") + snapshot storico sessioni.
-- Esegui DOPO 001-018 nell'SQL editor di Supabase.

alter table schede
  add column created_at timestamptz not null default now(),
  add column updated_at timestamptz not null default now(),
  add column is_archiviata boolean not null default false;

-- Stessa funzione trigger già usata da `eventi` (supabase/017_agenda.sql):
-- `create or replace` è idempotente, si può ridefinire qui senza rischi
-- anche se 017 è già stata eseguita.
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists schede_set_updated_at on schede;
create trigger schede_set_updated_at
  before update on schede
  for each row execute function set_updated_at();

-- Snapshot JSON della struttura scheda (blocchi/esercizi con target) al
-- momento in cui la sessione viene avviata: se la scheda viene modificata
-- dopo, le sessioni già registrate restano invariate. Colonna nullable per
-- non rompere le sessioni già esistenti create prima di questa migrazione
-- (che continuano a leggere la scheda live come fallback).
alter table sessioni
  add column scheda_snapshot jsonb;

-- Con più schede eliminabili, una sessione non deve più bloccare la
-- cancellazione della scheda a cui è legata: lo snapshot la rende comunque
-- autosufficiente per la lettura storica. `on delete set null` al posto del
-- vincolo implicito "no action" di `references schede(id)`.
alter table sessioni drop constraint if exists sessioni_scheda_id_fkey;
alter table sessioni
  add constraint sessioni_scheda_id_fkey
  foreign key (scheda_id) references schede(id) on delete set null;
