-- Migrazione 035: assistente Telegram (bot privato di Lorenzo).
-- Esegui DOPO 001-034 nell'SQL editor di Supabase.
--
-- Stessa convenzione RLS del resto dell'area privata: RLS abilitata, nessuna
-- policy (default-deny), letture/scritture solo lato server con la service
-- role key, a valle dei controlli della route webhook (secret + chat id).

-- Movimenti proposti dall'assistente, in attesa del tap su "Conferma".
-- Niente finisce in spese/depositi senza conferma esplicita: una
-- trascrizione sbagliata resta una bozza annullabile.
create table telegram_bozze (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  tipo text not null check (tipo in ('spesa', 'entrata')),
  titolo text not null check (char_length(titolo) between 1 and 200),
  importo numeric(10, 2) not null check (importo > 0),
  data date not null,
  categoria_id uuid references categorie(id),
  descrizione text,
  stato text not null default 'in_attesa' check (stato in ('in_attesa', 'confermata', 'annullata')),
  movimento_id uuid
);

create index telegram_bozze_stato_idx on telegram_bozze (stato, created_at);
alter table telegram_bozze enable row level security;

-- update_id già gestiti: Telegram ripete l'invio se il webhook è lento o
-- risponde con errore, e senza questo controllo ogni ripetizione
-- produrrebbe una seconda risposta (e una seconda chiamata all'LLM).
create table telegram_update_visti (
  update_id bigint primary key,
  created_at timestamptz not null default now()
);

alter table telegram_update_visti enable row level security;

-- Le segnalazioni dettate al bot entrano nello stesso ciclo dei feedback
-- dell'area privata (issue notturne, agenti), con origine distinguibile.
alter table feedback drop constraint if exists feedback_origine_check;
alter table feedback add constraint feedback_origine_check
  check (origine in ('tab', 'suggerimento', 'altro', 'desktop', 'pulsante', 'telegram'));
