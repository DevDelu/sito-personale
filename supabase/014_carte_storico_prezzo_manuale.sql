-- Migrazione 014: storico del prezzo manuale, per poter costruire un
-- andamento nel tempo (grafico) anche per le carte senza id_product o dove
-- si preferisce sovrascrivere il trend Cardmarket.
-- Esegui DOPO 013 nell'SQL editor di Supabase.
--
-- my_collection.manual_price (dalla 012) era un singolo valore sovrascrivibile:
-- ogni modifica perdeva il prezzo precedente, quindi non si poteva costruire
-- un trend. Sostituito da una tabella di snapshot datati, stesso pattern di
-- `prices` (id_product + snapshot_date) ma per singola riga di collezione.
-- Verificato: nessuna riga in produzione ha manual_price valorizzato,
-- quindi drop diretto della colonna, nessun dato da migrare.

create table manual_price_snapshots (
  id              bigserial primary key,
  collection_id   bigint not null references my_collection(id) on delete cascade,
  snapshot_date   date not null,
  price           numeric not null,
  created_at      timestamptz not null default now(),
  unique (collection_id, snapshot_date)
);

create index manual_price_snapshots_collection_id_idx on manual_price_snapshots (collection_id);

alter table manual_price_snapshots enable row level security;

-- La view va droppata PRIMA di rimuovere la colonna che referenzia,
-- altrimenti Postgres rifiuta l'alter (dipendenza esplicita).
drop view if exists v_collection_current;

alter table my_collection drop column manual_price;

create view v_collection_current as
select
  mc.id,
  mc.card_id,
  mc.quantity,
  mc.condition,
  mc.language,
  mc.is_foil,
  mc.purchase_price,
  mc.notes,
  fwc.id_product,
  fwc.name,
  fwc.card_number,
  fwc.product_type,
  fwc.image_url,
  coalesce(mp.price, p.trend) as current_price,
  mp.price is not null as is_manual_price,
  mp.price as manual_price,
  p.avg30,
  p.snapshot_date
from my_collection mc
join fusion_world_cards fwc on fwc.id = mc.card_id
left join lateral (
  select * from prices
  where prices.id_product = fwc.id_product
  order by snapshot_date desc
  limit 1
) p on fwc.id_product is not null
left join lateral (
  select * from manual_price_snapshots
  where manual_price_snapshots.collection_id = mc.id
  order by snapshot_date desc
  limit 1
) mp on true;
