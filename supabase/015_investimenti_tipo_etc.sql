-- Migrazione 015: aggiunge il tipo 'etc' ad assets.tipo, distinto da 'etf'.
-- Esegui DOPO 006-014 nell'SQL editor di Supabase.
--
-- SGLD (ETC oro fisico, IE00B579F325) era classificato come 'etf' perché
-- 'etc' non era ancora un valore ammesso dal check constraint: va
-- riclassificato per separarlo dagli ETF veri e propri nella torta di
-- allocazione (AllocationChart) e negli altri punti UI che leggono
-- assets.tipo.

alter table assets drop constraint if exists assets_tipo_check;
alter table assets add constraint assets_tipo_check
  check (tipo in ('stock', 'etf', 'etc', 'indice', 'crypto'));

update assets set tipo = 'etc' where ticker = 'SGLD';
