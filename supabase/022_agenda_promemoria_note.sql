-- Migrazione 022: promemoria email per le note del giorno.
-- Esegui DOPO 001-021 nell'SQL editor di Supabase.
--
-- Riga singola (stessa convenzione di integrazione_google): un interruttore
-- per attivare/disattivare l'invio del promemoria via email (cron delle
-- 9:00, vedi app/api/agenda/note-reminder/route.ts), senza dover toccare
-- codice o variabili d'ambiente per spegnerlo temporaneamente.

create table if not exists agenda_impostazioni (
  id uuid primary key default gen_random_uuid(),
  promemoria_note_attivo boolean not null default true
);

insert into agenda_impostazioni (promemoria_note_attivo)
select true
where not exists (select 1 from agenda_impostazioni);

alter table agenda_impostazioni enable row level security;
