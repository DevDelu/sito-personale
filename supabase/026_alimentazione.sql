-- Migrazione 026: nuovo modulo Alimentazione (Fase A).
-- Esegui DOPO 001-025 nell'SQL editor di Supabase.
--
-- Nota su RLS/user_id: come tutte le altre tabelle di dominio del progetto
-- (spese, investimenti, carte, allenamento, agenda — vedi le rispettive
-- migration), queste tabelle NON hanno una colonna `user_id` e NON hanno
-- policy per i ruoli anon/authenticated: RLS è abilitata ma resta
-- default-deny per tutti i ruoli client, e l'app legge/scrive sempre lato
-- server con la service role key (`createAdminClient()`), a valle del
-- doppio controllo requireUser()/isOwner() (vedi CLAUDE.md). L'unica tabella
-- del progetto con `user_id` + policy `auth.uid()` è `quiz_attempts`/
-- `profiles` (025_quiz.sql), perché il quiz è l'unica funzionalità
-- realmente multi-utente (login Google aperto a chiunque); l'area privata,
-- Alimentazione inclusa, resta a singolo utente (Lorenzo), quindi replica
-- la convenzione "default-deny, niente user_id" già in uso ovunque altro
-- invece del pattern user_id/auth.uid() generico.

create table alimenti (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  kcal_100g numeric not null check (kcal_100g >= 0),
  proteine_100g numeric not null default 0 check (proteine_100g >= 0),
  carboidrati_100g numeric not null default 0 check (carboidrati_100g >= 0),
  grassi_100g numeric not null default 0 check (grassi_100g >= 0),
  created_at timestamptz not null default now()
);

-- Snapshot storico: kcal/proteine_g/carboidrati_g/grassi_g sono calcolati UNA
-- VOLTA al momento dell'insert (quantita_g × valori/100g dell'alimento in
-- quel momento) e mai più ricalcolati da un join a `alimenti`, stesso
-- principio di `sessioni_log` in 016_allenamento.sql che referenzia
-- `scheda_esercizi` senza essere impattata da modifiche successive alla
-- scheda: se l'utente corregge un valore nutrizionale nel catalogo dopo aver
-- loggato un pasto, i pasti già registrati non devono cambiare.
-- `alimento_nome` è anch'esso uno snapshot del nome (non solo dei valori
-- nutrizionali): estensione minima rispetto alla lista colonne di base, utile
-- perché `alimento_id` è `on delete set null` (un alimento può essere
-- rimosso dal catalogo senza invalidare la storia dei pasti già loggati) e
-- senza questo snapshot la riga perderebbe ogni riferimento leggibile.
create table pasti (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  tipo_pasto text not null check (tipo_pasto in ('colazione', 'pranzo', 'cena', 'spuntino')),
  alimento_id uuid references alimenti(id) on delete set null,
  alimento_nome text not null,
  quantita_g numeric not null check (quantita_g > 0),
  kcal numeric not null check (kcal >= 0),
  proteine_g numeric not null default 0 check (proteine_g >= 0),
  carboidrati_g numeric not null default 0 check (carboidrati_g >= 0),
  grassi_g numeric not null default 0 check (grassi_g >= 0),
  note text,
  created_at timestamptz not null default now()
);

create index pasti_data_idx on pasti (data);
create index pasti_tipo_pasto_idx on pasti (tipo_pasto);
create index pasti_alimento_id_idx on pasti (alimento_id);

-- Un peso al giorno (storico settimanale): la pagina Profilo mostra tutto lo
-- storico, non solo l'ultimo valore, ma il TDEE usa sempre la riga più
-- recente per data.
create table peso_corporeo (
  id uuid primary key default gen_random_uuid(),
  data date not null unique,
  peso_kg numeric not null check (peso_kg > 0),
  note text,
  created_at timestamptz not null default now()
);

create index peso_corporeo_data_idx on peso_corporeo (data);

-- Singleton: una sola riga per l'unico utente dell'area privata (nessun
-- vincolo esplicito a livello DB per restare nella stessa semplicità delle
-- altre tabelle del progetto — lib/alimentazione/queries.ts legge/scrive
-- sempre la riga più recente e fa upsert su quella, mai insert multipli
-- dal form Profilo).
create table profilo_nutrizionale (
  id uuid primary key default gen_random_uuid(),
  altezza_cm numeric check (altezza_cm > 0),
  eta int check (eta > 0),
  sesso text check (sesso in ('M', 'F')),
  livello_attivita text not null default 'sedentario'
    check (livello_attivita in ('sedentario', 'leggero', 'moderato', 'attivo', 'molto_attivo')),
  fase_obiettivo text not null default 'mantenimento'
    check (fase_obiettivo in ('mantenimento', 'surplus', 'deficit')),
  percentuale_fase numeric not null default 0 check (percentuale_fase >= 0 and percentuale_fase <= 100),
  updated_at timestamptz not null default now()
);

alter table alimenti enable row level security;
alter table pasti enable row level security;
alter table peso_corporeo enable row level security;
alter table profilo_nutrizionale enable row level security;

-- Nessuna policy per anon/authenticated su nessuna delle quattro tabelle
-- (stessa convenzione di spese/investimenti/carte/allenamento/agenda): RLS
-- abilitata e default-deny, accesso solo dal server con la service role key.

-- TDEE/riepilogo giornaliero/trend settimanale: calcolati lato TypeScript in
-- lib/alimentazione/queries.ts (stesso principio del costo-base FIFO di
-- lib/investimenti/fifo.ts, anch'esso calcolato in TS e non con una vista
-- SQL) — non esiste nel repo un equivalente di "vista calcolata" per logica
-- con più di un semplice join, quindi niente vista SQL qui.

-- Fuori scope per la Fase A (vedi README, sezione Decision log):
-- integrazione con i giorni di allenamento del modulo workout, catalogo
-- esterno/barcode/foto/AI, ricette/meal planning/lista della spesa,
-- notifiche/promemoria.
