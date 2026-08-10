-- Migrazione 018: reintroduce categoria_suggerita per l'import CSV grezzi
-- (Crypto.com + Intesa Sanpaolo) con categorizzazione automatica via regole.
-- Colonna rimossa in 004 quando la categorizzazione era ancora manuale via
-- chat; ora torna utile per audit/debug delle righe finite in "Altro".
-- Esegui DOPO 001-017 nell'SQL editor di Supabase.

alter table spese add column if not exists categoria_suggerita text;
alter table depositi add column if not exists categoria_suggerita text;

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

drop view if exists movimenti_con_categoria;
create view movimenti_con_categoria as
select
  s.id,
  'spesa' as tipo,
  s.data,
  s.importo,
  s.titolo,
  s.descrizione,
  s.categoria_id,
  s.categoria_suggerita,
  s.nominativo,
  s.dettaglio,
  s.fonte,
  c.nome as categoria_nome,
  c.colore as categoria_colore
from spese s
left join categorie c on c.id = s.categoria_id
union all
select
  d.id,
  'entrata' as tipo,
  d.data,
  d.importo,
  d.titolo,
  d.descrizione,
  d.categoria_id,
  d.categoria_suggerita,
  d.nominativo,
  d.dettaglio,
  d.fonte,
  c.nome as categoria_nome,
  c.colore as categoria_colore
from depositi d
left join categorie c on c.id = d.categoria_id;
