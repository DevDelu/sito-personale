-- Migrazione 031: feedback di Lorenzo dall'area privata (Radar, Fase 2 —
-- POTENZIAMENTO 1). Esegui DOPO 001-030 nell'SQL editor di Supabase.
--
-- Nota su RLS: stessa convenzione di tutte le altre tabelle dell'area
-- privata (vedi il commento in testa a 030_push_subscriptions.sql): RLS
-- abilitata, nessuna policy per anon/authenticated (default-deny), l'app
-- legge/scrive solo lato server con la service role key a valle di
-- getUser() + isOwner(). La policy di sola lettura per l'utente tester degli
-- agenti notturni andrà aggiunta quando quell'utente esisterà (Fase 1):
-- oggi non c'è un ruolo tester da referenziare.
--
-- Una riga = un feedback. `pagina` è il template della route (segmenti
-- dinamici sostituiti da [id]), `contesto` contiene solo metadati tecnici
-- (chiavi dei filtri senza valori, viewport, tema, versione, eventi di
-- attrito recenti): nessuno screenshot, nessun importo.

create table feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  pagina text not null,
  tipo text not null check (tipo in ('problema', 'complicato', 'idea')),
  testo text not null check (char_length(testo) between 1 and 500),
  origine text not null check (origine in ('tab', 'suggerimento', 'altro', 'desktop')),
  contesto jsonb not null default '{}'::jsonb,
  stato text not null default 'nuovo' check (stato in ('nuovo', 'in-lavorazione', 'risolto', 'scartato')),
  issue_number integer,
  pr_number integer
);

create index feedback_stato_idx on feedback (stato, created_at);
create index feedback_issue_number_idx on feedback (issue_number) where issue_number is not null;

alter table feedback enable row level security;
