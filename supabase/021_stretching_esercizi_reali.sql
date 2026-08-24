-- Migrazione 021: nomi reali per gli esercizi del blocco Stretching.
-- Esegui DOPO 001-020 nell'SQL editor di Supabase.
--
-- Le 4 righe del blocco "Stretching" (scheda "Full body casa") puntavano
-- tutte allo stesso esercizio "Stretching", distinte solo dal campo
-- zona_corporea: durante l'allenamento comparivano quindi tutte con lo
-- stesso nome. Qui si creano 4 esercizi distinti con un nome reale e si
-- aggiornano le righe esistenti per puntare a quello giusto (match per
-- zona_corporea, non per ordine: robusto anche se le righe sono state
-- riordinate dall'interfaccia).

insert into esercizi (nome, tipo_metrica) values
  ('Stretching quadricipiti in piedi', 'tempo'),
  ('Stretching pettorali al muro', 'tempo'),
  ('Stretching spalle a braccio incrociato', 'tempo'),
  ('Stretching schiena (posizione del bambino)', 'tempo');

update scheda_esercizi
set esercizio_id = (select id from esercizi where nome = 'Stretching quadricipiti in piedi')
where blocco = 'Stretching' and zona_corporea = 'Gambe'
  and esercizio_id = (select id from esercizi where nome = 'Stretching' limit 1);

update scheda_esercizi
set esercizio_id = (select id from esercizi where nome = 'Stretching pettorali al muro')
where blocco = 'Stretching' and zona_corporea = 'Petto'
  and esercizio_id = (select id from esercizi where nome = 'Stretching' limit 1);

update scheda_esercizi
set esercizio_id = (select id from esercizi where nome = 'Stretching spalle a braccio incrociato')
where blocco = 'Stretching' and zona_corporea = 'Spalle'
  and esercizio_id = (select id from esercizi where nome = 'Stretching' limit 1);

update scheda_esercizi
set esercizio_id = (select id from esercizi where nome = 'Stretching schiena (posizione del bambino)')
where blocco = 'Stretching' and zona_corporea = 'Schiena'
  and esercizio_id = (select id from esercizi where nome = 'Stretching' limit 1);

-- Il vecchio esercizio catalogo "Stretching" resta (referenziato dallo
-- scheda_snapshot delle sessioni già svolte, per non alterare lo storico):
-- non va eliminato.
