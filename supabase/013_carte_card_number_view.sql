-- Migrazione 013: espone card_number in v_collection_current.
-- Esegui DOPO 012 nell'SQL editor di Supabase.
--
-- fusion_world_cards.card_number esiste dalla 010 (usato nel form "Aggiungi
-- carta") ma non era mai stato selezionato dalla view: senza, l'Overview e
-- il popup di dettaglio non possono mostrare il codice carta (es. "FB10-070"
-- o "E01-01") accanto a nome/immagine. Migrazione additiva, nessun dato
-- toccato.

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
  fwc.card_number,
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
