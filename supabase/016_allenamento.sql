-- Migrazione 016: nuovo modulo Allenamento.
-- Esegui DOPO 001-015 nell'SQL editor di Supabase.
--
-- Nota su `ordine`: è una sequenza GLOBALE su tutta la scheda (1..N), non
-- riparte da 1 a ogni blocco. `blocco` resta solo un'etichetta di
-- raggruppamento/visualizzazione: se si ordinasse per blocco (testo) prima
-- che per ordine, l'ordine alfabetico romperebbe la sequenza reale
-- dell'allenamento (es. "Addome" verrebbe prima di "Riscaldamento"). Le
-- query leggono quindi le righe con un semplice `order by ordine`.

create table impegni_fissi (
  id uuid primary key default gen_random_uuid(),
  giorno_settimana int not null check (giorno_settimana between 0 and 6),
  titolo text not null,
  orario text,
  note text,
  attivo boolean default true
);

create table esercizi (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo_metrica text not null default 'serie_rip'
    check (tipo_metrica in ('serie_rip', 'serie_rip_peso', 'tempo')),
  note text
);

create table schede (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descrizione text
);

create table scheda_esercizi (
  id uuid primary key default gen_random_uuid(),
  scheda_id uuid references schede(id) on delete cascade,
  esercizio_id uuid references esercizi(id),
  blocco text not null,
  ordine int not null,
  tipo_riga text not null default 'normale'
    check (tipo_riga in ('normale', 'circuito', 'stretching')),
  target_serie int,
  target_rip_min int,
  target_rip_max int,
  target_peso numeric,
  target_tempo_sec int,
  riposo_sec int,
  rounds int,
  lavoro_sec int,
  pausa_sec int,
  zona_corporea text,
  note text
);

create table sessioni (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  scheda_id uuid references schede(id),
  durata_min int,
  sensazione int check (sensazione between 1 and 5),
  note text
);

create table sessioni_log (
  id uuid primary key default gen_random_uuid(),
  sessione_id uuid references sessioni(id) on delete cascade,
  scheda_esercizio_id uuid references scheda_esercizi(id),
  serie_effettive int,
  rip_effettive int,
  peso_effettivo numeric,
  tempo_effettivo_sec int
);

-- Stessa convenzione delle altre tabelle del progetto: RLS abilitata senza
-- policy per anon/authenticated, l'app legge/scrive sempre lato server con
-- la service role key (bypassa RLS).
alter table impegni_fissi enable row level security;
alter table esercizi enable row level security;
alter table schede enable row level security;
alter table scheda_esercizi enable row level security;
alter table sessioni enable row level security;
alter table sessioni_log enable row level security;

-- Seed: catalogo esercizi della scheda "Full body casa".
insert into esercizi (nome, tipo_metrica) values
  ('Jumping jack', 'tempo'),
  ('Squat corpo libero', 'serie_rip'),
  ('Circonduzioni braccia', 'tempo'),
  ('Affondi in cammino', 'serie_rip'),
  ('Plank', 'tempo'),
  ('Corda', 'tempo'),
  ('Trazioni', 'serie_rip'),
  ('Dip', 'serie_rip'),
  ('Push up', 'serie_rip'),
  ('Dead hang', 'tempo'),
  ('Goblet squat', 'serie_rip_peso'),
  ('Shoulder press', 'serie_rip_peso'),
  ('Affondi', 'serie_rip'),
  ('Alzate laterali/frontali', 'serie_rip_peso'),
  ('Crunch', 'serie_rip'),
  ('Leg raise', 'serie_rip'),
  ('Russian twist', 'serie_rip'),
  ('Stretching', 'tempo');

-- Seed: scheda "Full body casa".
insert into schede (nome, descrizione) values
  ('Full body casa', 'Scheda calisthenics settimanale (1x/settimana), tracking completo.');

-- Seed: righe della scheda, in ordine di esecuzione.
insert into scheda_esercizi (
  scheda_id, esercizio_id, blocco, ordine, tipo_riga,
  target_serie, target_rip_min, target_rip_max, target_peso, target_tempo_sec,
  riposo_sec, rounds, lavoro_sec, pausa_sec, zona_corporea, note
)
select (select id from schede where nome = 'Full body casa'), id, 'Riscaldamento', 1, 'normale',
  1, null::int, null::int, null::numeric, 120, null::int, null::int, null::int, null::int, null::text, null::text
from esercizi where nome = 'Jumping jack'
union all
select (select id from schede where nome = 'Full body casa'), id, 'Riscaldamento', 2, 'normale',
  1, 15, 15, null::numeric, null::int, null::int, null::int, null::int, null::int, null::text, null::text
from esercizi where nome = 'Squat corpo libero'
union all
select (select id from schede where nome = 'Full body casa'), id, 'Riscaldamento', 3, 'normale',
  2, null::int, null::int, null::numeric, 30, null::int, null::int, null::int, null::int, null::text, null::text
from esercizi where nome = 'Circonduzioni braccia'
union all
select (select id from schede where nome = 'Full body casa'), id, 'Riscaldamento', 4, 'normale',
  1, 10, 10, null::numeric, null::int, null::int, null::int, null::int, null::int, null::text, 'per gamba'
from esercizi where nome = 'Affondi in cammino'
union all
select (select id from schede where nome = 'Full body casa'), id, 'Riscaldamento', 5, 'normale',
  1, null::int, null::int, null::numeric, 30, null::int, null::int, null::int, null::int, null::text, null::text
from esercizi where nome = 'Plank'

union all
select (select id from schede where nome = 'Full body casa'), id, 'Corda', 6, 'circuito',
  null::int, null::int, null::int, null::numeric, null::int, null::int, 8, 40, 15, null::text, null::text
from esercizi where nome = 'Corda'

union all
select (select id from schede where nome = 'Full body casa'), id, 'Blocco 1 - Trazioni/Dip', 7, 'normale',
  4, null::int, null::int, null::numeric, null::int, 100, null::int, null::int, null::int, null::text, 'ripetizioni massime (max reps)'
from esercizi where nome = 'Trazioni'
union all
select (select id from schede where nome = 'Full body casa'), id, 'Blocco 1 - Trazioni/Dip', 8, 'normale',
  4, 8, 12, null::numeric, null::int, 100, null::int, null::int, null::int, null::text, null::text
from esercizi where nome = 'Dip'

union all
select (select id from schede where nome = 'Full body casa'), id, 'Blocco 2 - Push-up/Dead hang', 9, 'normale',
  3, 12, 15, null::numeric, null::int, 75, null::int, null::int, null::int, null::text, null::text
from esercizi where nome = 'Push up'
union all
select (select id from schede where nome = 'Full body casa'), id, 'Blocco 2 - Push-up/Dead hang', 10, 'normale',
  3, null::int, null::int, null::numeric, 30, 75, null::int, null::int, null::int, null::text, 'range 30-40s, punta al massimo'
from esercizi where nome = 'Dead hang'

union all
select (select id from schede where nome = 'Full body casa'), id, 'Blocco 3 - Squat/Shoulder press', 11, 'normale',
  4, 12, 12, null::numeric, null::int, 90, null::int, null::int, null::int, null::text, null::text
from esercizi where nome = 'Goblet squat'
union all
select (select id from schede where nome = 'Full body casa'), id, 'Blocco 3 - Squat/Shoulder press', 12, 'normale',
  4, 10, 10, null::numeric, null::int, 90, null::int, null::int, null::int, null::text, null::text
from esercizi where nome = 'Shoulder press'

union all
select (select id from schede where nome = 'Full body casa'), id, 'Blocco 4 - Affondi/Alzate', 13, 'normale',
  3, 10, 10, null::numeric, null::int, 75, null::int, null::int, null::int, null::text, 'per gamba'
from esercizi where nome = 'Affondi'
union all
select (select id from schede where nome = 'Full body casa'), id, 'Blocco 4 - Affondi/Alzate', 14, 'normale',
  3, 12, 12, null::numeric, null::int, 75, null::int, null::int, null::int, null::text, null::text
from esercizi where nome = 'Alzate laterali/frontali'

union all
select (select id from schede where nome = 'Full body casa'), id, 'Addome (2 giri)', 15, 'normale',
  2, 20, 20, null::numeric, null::int, null::int, null::int, null::int, null::int, null::text, 'Parte del giro addome (Crunch → Leg raise → Russian twist → Plank), riposo solo dopo Plank'
from esercizi where nome = 'Crunch'
union all
select (select id from schede where nome = 'Full body casa'), id, 'Addome (2 giri)', 16, 'normale',
  2, 15, 15, null::numeric, null::int, null::int, null::int, null::int, null::int, null::text, 'Parte del giro addome (Crunch → Leg raise → Russian twist → Plank), riposo solo dopo Plank'
from esercizi where nome = 'Leg raise'
union all
select (select id from schede where nome = 'Full body casa'), id, 'Addome (2 giri)', 17, 'normale',
  2, 20, 20, null::numeric, null::int, null::int, null::int, null::int, null::int, null::text, 'Parte del giro addome (Crunch → Leg raise → Russian twist → Plank), riposo solo dopo Plank'
from esercizi where nome = 'Russian twist'
union all
select (select id from schede where nome = 'Full body casa'), id, 'Addome (2 giri)', 18, 'normale',
  2, null::int, null::int, null::numeric, 60, 45, null::int, null::int, null::int, null::text, 'Parte del giro addome, riposo di 45s dopo ogni giro completo'
from esercizi where nome = 'Plank'

union all
select (select id from schede where nome = 'Full body casa'), id, 'Stretching', 19, 'stretching',
  null::int, null::int, null::int, null::numeric, 28, null::int, null::int, null::int, null::int, 'Gambe', null::text
from esercizi where nome = 'Stretching'
union all
select (select id from schede where nome = 'Full body casa'), id, 'Stretching', 20, 'stretching',
  null::int, null::int, null::int, null::numeric, 28, null::int, null::int, null::int, null::int, 'Petto', null::text
from esercizi where nome = 'Stretching'
union all
select (select id from schede where nome = 'Full body casa'), id, 'Stretching', 21, 'stretching',
  null::int, null::int, null::int, null::numeric, 28, null::int, null::int, null::int, null::int, 'Spalle', null::text
from esercizi where nome = 'Stretching'
union all
select (select id from schede where nome = 'Full body casa'), id, 'Stretching', 22, 'stretching',
  null::int, null::int, null::int, null::numeric, 28, null::int, null::int, null::int, null::int, 'Schiena', null::text
from esercizi where nome = 'Stretching';

-- Nessuna riga in impegni_fissi: i giorni per boxe/nuoto non sono ancora
-- decisi, vanno aggiunti dall'interfaccia (vedi Obiettivo 2).
