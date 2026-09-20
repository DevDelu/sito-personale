-- Migrazione 030: subscription Web Push (VAPID) per le notifiche PWA.
-- Esegui DOPO 001-029 nell'SQL editor di Supabase.
--
-- Nota su RLS/user_id: come tutte le altre tabelle di dominio del progetto
-- (spese, investimenti, carte, allenamento, agenda, alimentazione — vedi le
-- rispettive migration), questa tabella NON ha una colonna `user_id` e NON
-- ha policy per i ruoli anon/authenticated: RLS è abilitata ma resta
-- default-deny per tutti i ruoli client, e l'app legge/scrive sempre lato
-- server con la service role key (`createAdminClient()`), a valle del
-- doppio controllo requireUser()/isOwner() (vedi CLAUDE.md). L'unica
-- tabella del progetto con `user_id` + policy `auth.uid()` è
-- `quiz_attempts`/`profiles` (025_quiz.sql), perché il quiz è l'unica
-- funzionalità realmente multi-utente; l'area privata, notifiche push
-- incluse, resta a singolo utente (Lorenzo), quindi replica la convenzione
-- "default-deny, niente user_id" già in uso ovunque altro.
--
-- Una riga = un device/browser con permesso push attivo (endpoint
-- restituito da PushManager.subscribe()). L'app fa sempre upsert su
-- `endpoint` (unique): reinstallare la PWA sullo stesso device o riattivare
-- le notifiche non crea doppioni.

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

alter table push_subscriptions enable row level security;
