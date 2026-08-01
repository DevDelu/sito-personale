-- Migrazione 006: modulo Investimenti.
-- Esegui DOPO 001-005 nell'SQL editor di Supabase.
--
-- NOTE IMPORTANTI SUI DATI SEED:
-- 1. Per i 4 ETF/ETC non sono disponibili le transazioni singole, solo
--    quantità netta e costo storico netto da estratto conto. Vengono quindi
--    inserite come UNA transazione 'buy' aggregata per asset, con
--    costo_tipo='stimato' e una nota esplicita — non come dato verificato
--    riga per riga. Vanno corrette/scisse in Gestione quando si recuperano i
--    dati reali dei singoli acquisti.
-- 2. Il Bond ETF MUL LEGB 7-10Y (posizione chiusa, qty netta 0) NON viene
--    seedato: non sono stati forniti i dati delle transazioni che la
--    compongono, solo il fatto che la posizione è chiusa.
-- 3. Nessun prezzo di mercato "attuale" viene inserito in prezzi_storico:
--    il cron di aggiornamento prezzi (Twelve Data/CoinGecko) non è ancora
--    collegato in questa fase. La UI mostra esplicitamente quando un prezzo
--    non è aggiornato, invece di inventare un valore.

create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  isin text,
  nome text not null,
  tipo text not null check (tipo in ('stock', 'etf', 'indice', 'crypto')),
  valuta text not null default 'EUR',
  created_at timestamptz not null default now()
);

create table if not exists transazioni (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references assets(id) on delete cascade,
  tipo text not null check (tipo in ('buy', 'sell')),
  quantita numeric not null check (quantita > 0),
  prezzo_unitario numeric,
  data date not null,
  costo_tipo text not null default 'verificato'
    check (costo_tipo in ('verificato', 'stimato', 'sconosciuto')),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists transazioni_asset_idx on transazioni (asset_id);
create index if not exists transazioni_data_idx on transazioni (data);

create table if not exists prezzi_storico (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references assets(id) on delete cascade,
  data date not null,
  prezzo numeric not null,
  fonte text not null check (fonte in ('twelvedata', 'coingecko', 'manuale')),
  created_at timestamptz not null default now(),
  unique (asset_id, data)
);

create table if not exists portfolio_snapshot (
  id uuid primary key default gen_random_uuid(),
  data date not null unique,
  valore_totale numeric not null,
  created_at timestamptz not null default now()
);

-- Stessa convenzione delle tabelle Spese: RLS abilitata senza policy per
-- anon/authenticated, l'app legge/scrive sempre lato server con la service
-- role key (bypassa RLS). Vedi supabase/005_gestione_movimenti.sql.
alter table assets enable row level security;
alter table transazioni enable row level security;
alter table prezzi_storico enable row level security;
alter table portfolio_snapshot enable row level security;

-- View di lettura con il nome asset/tipo già uniti, usata da Gestione.
-- Il calcolo FIFO di costo medio/plusvalenza resta in TypeScript
-- (lib/investimenti/queries.ts), non qui: è più verificabile riga per riga
-- che un CTE ricorsivo in SQL su dati finanziari reali.
drop view if exists transazioni_con_asset;
create view transazioni_con_asset as
select
  t.*,
  a.ticker,
  a.nome as asset_nome,
  a.tipo as asset_tipo,
  a.valuta
from transazioni t
join assets a on a.id = t.asset_id;

-- Seed: anagrafica asset
insert into assets (ticker, isin, nome, tipo, valuta) values
  ('SX5E', 'FR0007054358', 'ETF Euro Stoxx 50', 'etf', 'EUR'),
  ('MWEQ', 'IE000OEF25S1', 'ETF MSCI World Equal Weight (Invesco)', 'etf', 'EUR'),
  ('SGLD', 'IE00B579F325', 'ETC Oro fisico', 'etf', 'EUR'),
  ('NDXE', 'LU1829221024', 'ETF Nasdaq 100 (Amundi)', 'etf', 'EUR'),
  ('BTC', null, 'Bitcoin', 'crypto', 'EUR')
on conflict do nothing;

-- Seed: transazioni aggregate ETF (vedi nota 1 in testa al file)
insert into transazioni (asset_id, tipo, quantita, prezzo_unitario, data, costo_tipo, note)
select id, 'buy', 33, 2040.12 / 33, '2026-01-01'::date,
  'stimato', 'Posizione aggregata da estratto conto: quantità/costo netti noti, data e suddivisione in lotti singoli da verificare.'
from assets where ticker = 'SX5E'
union all
select id, 'buy', 300, 1583.27 / 300, '2026-01-01'::date,
  'stimato', 'Posizione aggregata da estratto conto: quantità/costo netti noti, data e suddivisione in lotti singoli da verificare.'
from assets where ticker = 'MWEQ'
union all
select id, 'buy', 2, 558.37 / 2, '2026-01-01'::date,
  'stimato', 'Posizione aggregata da estratto conto (2 acquisti verificati, dati per singolo lotto non disponibili). Vendita precedente rimossa dai dati su indicazione utente.'
from assets where ticker = 'SGLD'
union all
select id, 'buy', 35, 2831.39 / 35, '2026-01-01'::date,
  'stimato', 'Posizione aggregata da estratto conto: quantità/costo netti noti, data e suddivisione in lotti singoli da verificare. ISIN storicamente noto anche come fondo Lyxor, poi rinominato.'
from assets where ticker = 'NDXE';

-- Seed: transazioni Bitcoin (dati reali, per singola transazione)
insert into transazioni (asset_id, tipo, quantita, prezzo_unitario, data, costo_tipo, note)
select id, 'buy', 0.01747, 57165.66, '2026-06-15'::date, 'verificato', 'Acquisto exchange.'
from assets where ticker = 'BTC'
union all
select id, 'buy', 0.0038, 52502.03, '2026-06-29'::date, 'verificato', 'Acquisto exchange.'
from assets where ticker = 'BTC'
union all
select id, 'buy', 0.0523684, 23000, '2023-03-14'::date, 'stimato',
  'Acquisto avvenuto al momento del trasferimento in wallet (3 tx on-chain, stesso evento economico). Prezzo BTC del giorno stimato (~23.000 €/BTC), da affinare quando disponibile un dato più preciso.'
from assets where ticker = 'BTC';
