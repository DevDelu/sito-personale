-- Migrazione v2: import Crypto.com, import Intesa Sanpaolo, inserimento manuale via chat.
-- Esegui nell'SQL editor di Supabase DOPO 001 (supabase/schema.sql).

alter table spese add column if not exists titolo text;
alter table spese add column if not exists categoria_banca text;

alter table depositi add column if not exists titolo text;
alter table depositi add column if not exists categoria_banca text;
alter table depositi add column if not exists fonte text not null default 'manuale';

-- CREATE OR REPLACE non basta: le nuove colonne su spese spostano la posizione
-- di categoria_nome/categoria_colore nell'output, e Postgres non permette di
-- rinominare/spostare colonne di una view esistente senza droppare prima.
drop view if exists spese_con_categoria;

create view spese_con_categoria as
select
  s.*,
  c.nome as categoria_nome,
  c.colore as categoria_colore
from spese s
left join categorie c on c.id = s.categoria_id;

-- Sostituisce le 12 categorie placeholder con quelle definitive.
-- Sicuro: nessuna spesa/deposito le referenzia ancora a questo punto.
delete from categorie;

insert into categorie (nome)
values
  ('Casa e Utenze'),
  ('Cibo e Ristorazione'),
  ('Trasporti e Carburante'),
  ('Salute e Cura della persona'),
  ('Sport e Tempo libero'),
  ('Shopping e Regali'),
  ('Collezionismo'),
  ('Tecnologia e Abbonamenti'),
  ('Tasse e Commissioni'),
  ('Prelievi Contanti'),
  ('Stipendio e Entrate'),
  ('Da categorizzare');
