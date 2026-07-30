-- Migrazione 004: import Excel pre-categorizzato al posto del CSV grezzo +
-- suggerimenti automatici. Esegui DOPO 001, 002, 003 nell'SQL editor di Supabase.

-- La categorizzazione ora avviene fuori dal sito (chat dedicata), quindi il
-- suggerimento automatico via euristica non serve più.
alter table spese drop column if exists categoria_suggerita;
alter table depositi drop column if exists categoria_suggerita;

-- Colonne già introdotte da 002/003, riconfermate qui per idempotenza nel
-- caso questa migrazione venga eseguita da sola su un DB alla versione 001.
alter table spese add column if not exists nominativo text;
alter table spese add column if not exists dettaglio text;
alter table spese add column if not exists note text;

alter table depositi add column if not exists nominativo text;
alter table depositi add column if not exists dettaglio text;
alter table depositi add column if not exists note text;
alter table depositi alter column fonte set default 'manuale';

-- Ricrea le view senza la colonna rimossa.
drop view if exists spese_con_categoria;
create view spese_con_categoria as
select
  s.*,
  c.nome as categoria_nome,
  c.colore as categoria_colore
from spese s
left join categorie c on c.id = s.categoria_id;

drop view if exists depositi_con_categoria;
create view depositi_con_categoria as
select
  d.*,
  c.nome as categoria_nome,
  c.colore as categoria_colore
from depositi d
left join categorie c on c.id = d.categoria_id;
