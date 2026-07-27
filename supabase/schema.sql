-- Schema iniziale per il modulo Spese dell'archivio personale.
-- Esegui questo script nell'SQL editor di Supabase (Database > SQL Editor).

create extension if not exists "pgcrypto";

-- Categorie di spesa (12 iniziali, espandibili)
create table if not exists categorie (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  colore text, -- opzionale: i colori del grafico a torta sono calcolati lato app per garanzie di accessibilità (vedi lib/chart-colors.ts), questo campo è solo per riferimento/etichette
  created_at timestamptz not null default now()
);

-- Spese
create table if not exists spese (
  id uuid primary key default gen_random_uuid(),
  importo numeric(10, 2) not null,
  descrizione text,
  categoria_id uuid references categorie(id),
  data date not null,
  settimana_riferimento date, -- lunedì della settimana della data, per raggruppare
  fonte text not null default 'csv_upload',
  created_at timestamptz not null default now()
);

create index if not exists spese_data_idx on spese (data);
create index if not exists spese_settimana_idx on spese (settimana_riferimento);
create index if not exists spese_categoria_idx on spese (categoria_id);

-- Depositi/entrate
create table if not exists depositi (
  id uuid primary key default gen_random_uuid(),
  importo numeric(10, 2) not null,
  descrizione text,
  data date not null,
  created_at timestamptz not null default now()
);

-- View aggregata: spese con nome/colore categoria già joinati
create or replace view spese_con_categoria as
select
  s.*,
  c.nome as categoria_nome,
  c.colore as categoria_colore
from spese s
left join categorie c on c.id = s.categoria_id;

-- Row Level Security: l'app usa la service role key lato server per le query,
-- quindi le tabelle restano bloccate per il ruolo anon/authenticated di default.
alter table categorie enable row level security;
alter table spese enable row level security;
alter table depositi enable row level security;

-- Categorie iniziali (placeholder, rinominabili in qualsiasi momento da qui)
insert into categorie (nome)
values
  ('Casa'),
  ('Cibo'),
  ('Trasporti'),
  ('Salute'),
  ('Svago'),
  ('Shopping'),
  ('Bollette'),
  ('Abbonamenti'),
  ('Viaggi'),
  ('Istruzione'),
  ('Regali'),
  ('Altro')
on conflict (nome) do nothing;
