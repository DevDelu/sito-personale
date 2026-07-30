-- Migrazione 003: redesign Archivio/Spese.
-- Esegui DOPO 001 (schema.sql) e 002 (002_spese_v2.sql), nell'SQL editor di Supabase.
--
-- ATTENZIONE — remap categorie con perdita di granularità:
-- le 12 categorie attuali (Casa e Utenze, Salute e Cura della persona, Sport e
-- Tempo libero, Shopping e Regali, Collezionismo, Tecnologia e Abbonamenti,
-- Tasse e Commissioni, Prelievi Contanti, Da categorizzare) NON hanno un
-- equivalente nel nuovo set più corto e finiscono tutte in "Altro". Solo
-- Cibo e Ristorazione/Trasporti e Carburante vengono ripartite in modo più
-- preciso usando categoria_banca (dove disponibile, cioè per le righe Intesa).
-- Le righe finite in "Altro" sono normali candidate per il badge "suggerito"
-- introdotto in questa stessa migrazione.

-- 1. Categorie: aggiunta tipo (spesa/entrata), univocità per (nome, tipo)
alter table categorie add column if not exists tipo text;
update categorie set tipo = 'spesa' where tipo is null;
alter table categorie alter column tipo set not null;

alter table categorie drop constraint if exists categorie_nome_key;
alter table categorie drop constraint if exists categorie_nome_tipo_key;
alter table categorie add constraint categorie_nome_tipo_key unique (nome, tipo);

-- 2. Nuove colonne su spese/depositi
alter table spese add column if not exists categoria_suggerita text;
alter table spese add column if not exists nominativo text;
alter table spese add column if not exists dettaglio text;
alter table spese add column if not exists note text;

alter table depositi add column if not exists categoria_id uuid references categorie(id);
alter table depositi add column if not exists categoria_suggerita text;
alter table depositi add column if not exists nominativo text;
alter table depositi add column if not exists dettaglio text;
alter table depositi add column if not exists note text;
alter table depositi alter column fonte set default 'manuale';

-- 3. Normalizza i valori di fonte (i parser ora scrivono 'crypto'/'intesa')
update spese set fonte = 'crypto' where fonte = 'crypto.com';
update spese set fonte = 'intesa' where fonte = 'intesa_sanpaolo';
update depositi set fonte = 'intesa' where fonte = 'intesa_sanpaolo';

-- 4. Snapshot del vecchio stato (nome categoria attuale + categoria_banca)
-- prima di introdurre le nuove categorie, per poter rimappare ogni riga.
create temporary table _spese_old as
select s.id as spesa_id, c.nome as old_nome, s.categoria_banca
from spese s
left join categorie c on c.id = s.categoria_id;

create temporary table _depositi_old as
select d.id as deposito_id, d.categoria_banca
from depositi d;

-- 5. Nuovo set di categorie (7 per le spese, 5 per le entrate)
insert into categorie (nome, tipo) values
  ('Alimentari', 'spesa'),
  ('Benzina', 'spesa'),
  ('Vinted', 'spesa'),
  ('PayPal', 'spesa'),
  ('Bonifici', 'spesa'),
  ('Ristoranti', 'spesa'),
  ('Altro', 'spesa'),
  ('Stipendio', 'entrata'),
  ('Rimborso', 'entrata'),
  ('Vinted', 'entrata'),
  ('Bonifici', 'entrata'),
  ('Altro', 'entrata')
on conflict (nome, tipo) do nothing;

-- 6. Rimappa le spese esistenti sul nuovo set
update spese s
set categoria_id = (
  select c.id from categorie c where c.tipo = 'spesa' and c.nome = t.new_nome
)
from (
  select
    o.spesa_id,
    case
      when o.categoria_banca ilike 'generi alimentari%' then 'Alimentari'
      when o.categoria_banca ilike 'ristoranti%' then 'Ristoranti'
      when o.categoria_banca ilike 'carburanti%' then 'Benzina'
      else 'Altro'
    end as new_nome
  from _spese_old o
) t
where s.id = t.spesa_id;

-- 7. Assegna categoria alle entrate esistenti (prima non categorizzate)
update depositi d
set categoria_id = (
  select c.id from categorie c where c.tipo = 'entrata' and c.nome = t.new_nome
)
from (
  select
    o.deposito_id,
    case
      when o.categoria_banca ilike 'stipendi%' then 'Stipendio'
      when o.categoria_banca ilike 'bonifici ricevuti%' then 'Bonifici'
      else 'Altro'
    end as new_nome
  from _depositi_old o
) t
where d.id = t.deposito_id;

-- 8. Rimuove le vecchie categorie ormai non referenziate (nessuna delle 12
-- storiche coincide per nome con quelle nuove, quindi questo filtro le
-- individua tutte in sicurezza).
delete from categorie
where nome not in (
  'Alimentari', 'Benzina', 'Vinted', 'PayPal', 'Bonifici', 'Ristoranti',
  'Stipendio', 'Rimborso', 'Altro'
);

-- 9. Ricrea la view spese_con_categoria (nuove colonne) e aggiunge l'equivalente per i depositi
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
