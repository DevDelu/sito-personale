-- Migrazione 036: sezione Novità (modifiche andate online) e resoconti
-- degli agenti dentro l'app, al posto delle email.
-- Esegui DOPO 001-035 nell'SQL editor di Supabase.
--
-- Stessa convenzione RLS del resto dell'area privata: RLS abilitata, nessuna
-- policy (default-deny), accesso solo lato server con la service role key.
-- Scrivono solo le route a secret (workflow di deploy e routine degli
-- agenti, vedi CLAUDE.md > "Novità e resoconti"); legge la pagina /novita.

-- Una riga per PR andata in produzione. pr_number unico: il workflow può
-- girare più volte sullo stesso deploy (o su deploy successivi che
-- contengono la stessa PR) senza creare doppioni.
create table novita (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  online_dal timestamptz not null default now(),
  deploy_sha text,
  pr_number integer not null unique,
  pr_url text,
  tipo text not null check (tipo in ('funzione', 'correzione', 'tecnico', 'annullata')),
  titolo text not null check (char_length(titolo) between 1 and 200),
  spiegazione text not null check (char_length(spiegazione) between 1 and 2000)
);

create index novita_online_idx on novita (online_dal desc);
alter table novita enable row level security;

-- Resoconto di fine turno degli agenti (prima era la newsletter via email).
-- Testo in Markdown semplice, mostrato in /novita/resoconti/<id> con un
-- renderer che non interpreta HTML.
create table resoconti (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  turno text not null check (char_length(turno) between 1 and 60),
  titolo text not null check (char_length(titolo) between 1 and 200),
  testo text not null check (char_length(testo) between 1 and 30000),
  azioni_per_te integer not null default 0 check (azioni_per_te >= 0)
);

create index resoconti_created_idx on resoconti (created_at desc);
alter table resoconti enable row level security;
