-- Migrazione 020: attrezzatura richiesta per esercizio.
-- Esegui DOPO 001-019 nell'SQL editor di Supabase.
--
-- Usata dal runner di sessione per avvisare, nella preview del prossimo
-- esercizio, di preparare l'attrezzo necessario prima di arrivarci.

alter table esercizi add column attrezzatura text;
