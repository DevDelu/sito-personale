-- Migrazione 010: Collezione Carte diventa manuale (niente import bulk catalogo).
-- Esegui DOPO 009 nell'SQL editor di Supabase.
--
-- Lo schema 009 aveva la PK di fusion_world_cards su id_product, pensata per
-- un import bulk del catalogo Cardmarket mai arrivato. Ora le carte si
-- aggiungono a mano dal form /carte/nuova: serve una PK propria (id) perché
-- id_product resta opzionale (serve solo per gli aggiornamenti prezzo).
-- Nessun dato reale in produzione: drop diretto, niente migrazione dati.

drop view if exists v_collection_current;
drop table if exists my_collection;
drop table if exists prices;
drop table if exists fusion_world_cards;

do $$ begin
  create type card_condition as enum ('NM', 'EX', 'GD', 'LP', 'PL', 'PO');
exception
  when duplicate_object then null;
end $$;

create table fusion_world_cards (
  id              bigserial primary key,
  id_product      bigint unique,
  name            text not null,
  set_code        text,
  card_number     text,
  product_type    product_type not null default 'carta',
  source          text not null default 'manuale' check (source in ('manuale', 'cardmarket_import')),
  id_category     integer,
  category_name   text,
  id_expansion    integer,
  id_metacard     bigint,
  date_added      timestamptz,
  image_url       text,
  created_at      timestamptz not null default now()
);

create table prices (
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

create index prices_id_product_idx on prices (id_product);
create index prices_snapshot_date_idx on prices (snapshot_date);

create table my_collection (
  id              bigserial primary key,
  card_id         bigint not null references fusion_world_cards(id) on delete cascade,
  quantity        integer not null default 1,
  condition       card_condition default 'NM',
  language        text default 'EN',
  is_foil         boolean not null default false,
  purchase_price  numeric,
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
-- è il prezzo di riferimento mostrato come "prezzo attuale". Carte senza
-- id_product restano in collezione ma con current_price null (gestito in UI).
create view v_collection_current as
select
  mc.id,
  mc.card_id,
  mc.quantity,
  mc.condition,
  mc.is_foil,
  mc.purchase_price,
  fwc.id_product,
  fwc.name,
  fwc.product_type,
  fwc.image_url,
  p.trend as current_price,
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
