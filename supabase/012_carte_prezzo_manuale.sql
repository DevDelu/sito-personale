-- Migrazione 012: prezzo attuale manuale su Carte, modifica/elimina dal sito.
-- Esegui DOPO 011 nell'SQL editor di Supabase.
--
-- Migrazione additiva: lo schema di 010 (PK propria su fusion_world_cards.id)
-- è già quello corretto e in produzione c'è già collezione reale, quindi
-- niente drop/recreate qui. manual_price permette di forzare il prezzo
-- attuale (utile per Energy Marker o carte senza storico Cardmarket) e ha
-- priorità sul trend importato. language e notes mancavano dalla view: senza
-- di loro il form di modifica non può precompilarli.

alter table my_collection add column if not exists manual_price numeric;

drop view if exists v_collection_current;
create view v_collection_current as
select
  mc.id,
  mc.card_id,
  mc.quantity,
  mc.condition,
  mc.language,
  mc.is_foil,
  mc.purchase_price,
  mc.manual_price,
  mc.notes,
  fwc.id_product,
  fwc.name,
  fwc.product_type,
  fwc.image_url,
  coalesce(mc.manual_price, p.trend) as current_price,
  mc.manual_price is not null as is_manual_price,
  p.avg30,
  p.snapshot_date
from my_collection mc
join fusion_world_cards fwc on fwc.id = mc.card_id
left join lateral (
  select * from prices
  where prices.id_product = fwc.id_product
  order by snapshot_date desc
  limit 1
) p on fwc.id_product is not null;
