-- Migrazione 035: assistente di Radar (bot Telegram privato + pagina
-- /assistente per parlare a voce).
-- Esegui DOPO 001-034 nell'SQL editor di Supabase.
--
-- Stessa convenzione RLS del resto dell'area privata: RLS abilitata, nessuna
-- policy (default-deny), letture/scritture solo lato server con la service
-- role key, a valle dei controlli delle route (webhook Telegram: secret +
-- chat id; pagina voce e sue API: owner, dal proxy).

-- Movimenti proposti dall'assistente, in attesa del tap su "Conferma".
-- Niente finisce in spese/depositi senza conferma esplicita: una
-- trascrizione sbagliata resta una bozza annullabile.
create table assistente_bozze (
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

create index assistente_bozze_stato_idx on assistente_bozze (stato, created_at);
alter table assistente_bozze enable row level security;

-- Memoria breve della chat Telegram: ultimi scambi (solo testo), così il
-- bot capisce "e il mese prima?". La pagina voce tiene la sua storia nel
-- browser e non scrive qui. /nuova svuota la conversazione.
create table assistente_storia (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  canale text not null check (canale in ('telegram')),
  ruolo text not null check (ruolo in ('user', 'assistant')),
  testo text not null check (char_length(testo) between 1 and 4000)
);

create index assistente_storia_canale_idx on assistente_storia (canale, created_at desc);
alter table assistente_storia enable row level security;

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
