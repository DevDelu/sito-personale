-- Migrazione 009: modulo Collezione Carte (Dragon Ball Super / Fusion World).
-- Esegui DOPO 008 nell'SQL editor di Supabase.
--
-- Nessun cron/route API di ingestione dati: il flusso è manuale, uguale
-- nello spirito all'import Excel di Spese/Investimenti ma con output SQL
-- invece di xlsx. Lorenzo scarica 3 JSON da Cardmarket (price guide,
-- anagrafica singles, anagrafica non-singles), li incolla in chat; Claude
-- genera uno statement `insert ... on conflict do update` pronto da
-- eseguire qui. Nessuna scrittura diretta dal sito.

do $$ begin
  create type product_type as enum ('carta', 'energy_marker', 'sigillato');
exception
  when duplicate_object then null;
end $$;

create table if not exists fusion_world_cards (
  id_product      bigint primary key,
  name            text not null,
  id_category     integer not null,
  category_name   text not null,
  id_expansion    integer not null,
  id_metacard     bigint,
  date_added      timestamptz,
  product_type    product_type not null default 'carta',
  image_url       text,
  created_at      timestamptz not null default now()
);

create table if not exists prices (
  id              bigserial primary key,
  id_product      bigint not null references fusion_world_cards(id_product) on delete cascade,
  snapshot_date   date not null,
  avg             numeric,
  low             numeric,
  trend           numeric,
  avg1            numeric,
  avg7            numeric,
  avg30           numeric,
  avg_foil        numeric,
  low_foil        numeric,
  trend_foil      numeric,
  avg1_foil       numeric,
  avg7_foil       numeric,
  avg30_foil      numeric,
  unique (id_product, snapshot_date)
);

create index if not exists prices_id_product_idx on prices (id_product);
create index if not exists prices_snapshot_date_idx on prices (snapshot_date);

create table if not exists my_collection (
  id_product      bigint primary key references fusion_world_cards(id_product) on delete cascade,
  quantity        integer not null default 1,
  notes           text,
  added_at        timestamptz not null default now()
);

-- Stessa convenzione delle altre tabelle del progetto: RLS abilitata senza
-- policy per anon/authenticated, l'app legge sempre lato server con la
-- service role key (bypassa RLS).
alter table fusion_world_cards enable row level security;
alter table prices enable row level security;
alter table my_collection enable row level security;

-- Prezzo più recente per ogni carta in collezione: il "trend" (Cardmarket)
-- è il prezzo di riferimento mostrato come "prezzo attuale". Nessun calcolo
-- lato client per trovare lo snapshot più recente.
drop view if exists v_collection_current;
create view v_collection_current as
select
  mc.id_product,
  mc.quantity,
  fwc.name,
  fwc.product_type,
  fwc.image_url,
  p.trend as current_price,
  p.avg30,
  p.snapshot_date
from my_collection mc
join fusion_world_cards fwc on fwc.id_product = mc.id_product
left join lateral (
  select * from prices
  where prices.id_product = mc.id_product
  order by snapshot_date desc
  limit 1
) p on true;
