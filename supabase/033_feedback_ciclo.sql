-- Migrazione 033: feedback con contesto preciso e ciclo chiuso fino alla
-- verifica di Lorenzo. Esegui DOPO 031 e 032 nell'SQL editor di Supabase.
--
-- Evoluzione di 031_feedback.sql, non una tabella nuova:
-- - `pagina` diventa `route` (template, es. /spese/gestione) e si aggiungono
--   `url` (path reale + query, resta solo qui), `area`, `entita`, `punto`;
-- - nuovi stati, con rimappatura di quelli esistenti (sotto);
-- - timeline `feedback_eventi`: ogni cambio di stato, nota, domanda,
--   risposta e nota-fix è una riga.
--
-- RLS: stessa convenzione di tutte le tabelle dell'area privata (vedi
-- 030_push_subscriptions.sql e 031): abilitata, nessuna policy per
-- anon/authenticated (default-deny). L'app legge e scrive solo lato server
-- con la service role key, a valle di requireUser() (lettura, owner o
-- tester) o requireWriter() (scrittura, solo owner); gli agenti passano da
-- /api/feedback/agente con il secret. Le tabelle non hanno una colonna
-- utente: "le proprie righe" di Lorenzo sono tutte le righe.

-- 1. Colonne nuove / rinominate ----------------------------------------------

alter table feedback rename column pagina to route;

alter table feedback
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists url text,
  add column if not exists area text,
  add column if not exists entita text,
  add column if not exists punto jsonb,
  add column if not exists riaperture integer not null default 0;

-- 2. Stati: rimappa i vecchi prima di cambiare il vincolo ---------------------

alter table feedback drop constraint if exists feedback_stato_check;

update feedback set stato = 'preso-in-carico'
  where stato = 'in-lavorazione' and pr_number is null;
-- in-lavorazione con pr_number resta in-lavorazione.
update feedback set stato = 'da-verificare' where stato = 'risolto';

alter table feedback add constraint feedback_stato_check check (stato in (
  'nuovo', 'preso-in-carico', 'serve-info', 'in-lavorazione',
  'da-verificare', 'verificato', 'riaperto', 'scartato'
));

create index if not exists feedback_route_idx on feedback (route, stato);

-- updated_at aggiornato a ogni modifica, qualunque sia la route che scrive.
create or replace function feedback_touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists feedback_updated_at on feedback;
create trigger feedback_updated_at before update on feedback
  for each row execute function feedback_touch_updated_at();

-- 3. Timeline ----------------------------------------------------------------

create table if not exists feedback_eventi (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references feedback (id) on delete cascade,
  created_at timestamptz not null default now(),
  autore text not null check (autore in ('lorenzo', 'agente', 'sistema')),
  tipo text not null check (tipo in ('cambio-stato', 'nota', 'domanda', 'risposta', 'nota-fix')),
  stato_da text,
  stato_a text,
  testo text check (testo is null or char_length(testo) <= 1000),
  -- Quando il job notturno ha riportato (parafrasato) questa nota/risposta
  -- di Lorenzo nella issue: null = ancora da riportare.
  riportato_at timestamptz
);

create index if not exists feedback_eventi_feedback_idx on feedback_eventi (feedback_id, created_at);
create index if not exists feedback_eventi_da_riportare_idx on feedback_eventi (created_at)
  where autore = 'lorenzo' and tipo in ('nota', 'risposta') and riportato_at is null;

alter table feedback_eventi enable row level security;

-- Storico minimo per i feedback che esistevano già: una riga "creato" con lo
-- stato attuale, così la timeline non parte vuota.
insert into feedback_eventi (feedback_id, created_at, autore, tipo, stato_da, stato_a, testo)
select f.id, f.created_at, 'sistema', 'cambio-stato', null, f.stato, 'Stato migrato da 031'
from feedback f
where not exists (select 1 from feedback_eventi e where e.feedback_id = f.id);
