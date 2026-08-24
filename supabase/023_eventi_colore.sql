-- Migrazione 023: colore personalizzato per evento (stile Google Calendar).
-- Esegui DOPO 001-022 nell'SQL editor di Supabase.
--
-- Nullable: null = usa il colore di default della categoria (comportamento
-- invariato per gli eventi esistenti), un valore esadecimale = override
-- scelto dall'utente per quel singolo evento.

alter table eventi add column colore text;
