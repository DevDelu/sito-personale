# Archivio personale

Sito personale con area pubblica (portfolio, in arrivo) e area privata (spese, in questa fase).
Next.js (App Router) + Supabase + Vercel.

> Nota per chi tocca il codice con un assistente AI: questo progetto usa Next.js 16, con
> breaking change rispetto alle versioni precedenti (es. `middleware.ts` → `proxy.ts`). Vedi
> `AGENTS.md` e `node_modules/next/dist/docs/` prima di modificare routing o auth.

## Setup locale

1. Installa le dipendenze:

   ```bash
   npm install
   ```

2. Crea un progetto su [supabase.com](https://supabase.com) (piano free).

3. Nell'SQL Editor di Supabase, esegui lo script [`supabase/schema.sql`](supabase/schema.sql).
   Crea le tabelle `categorie`, `spese`, `depositi`, la view `spese_con_categoria` e popola le
   12 categorie iniziali (placeholder, rinominabili in qualsiasi momento).

4. In Supabase, vai su **Authentication > Users** e crea manualmente il tuo utente
   (email + password). Non esiste un flusso di registrazione pubblico: l'unico account
   previsto è quello che crei qui.

5. Copia `.env.example` in `.env.local` e compila le variabili (Project Settings > API):

   ```bash
   cp .env.example .env.local
   ```

   - `NEXT_PUBLIC_SUPABASE_URL` — URL del progetto
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` — service role key (**segreta**, mai esposta al client;
     usata solo server-side per leggere/scrivere spese bypassando la Row Level Security)

6. Avvia il server di sviluppo:

   ```bash
   npm run dev
   ```

   Apri [http://localhost:3000](http://localhost:3000). `/` è la homepage pubblica,
   `/login` porta all'area privata, `/spese` è protetta e richiede login.

## Modulo Spese

- **Upload CSV** (`/spese/upload`): colonne attese `importo`, `data` (obbligatorie),
  `descrizione`, `categoria` (opzionali; nomi alternativi accettati: `amount`, `date`).
  Le categorie citate nel CSV ma non ancora presenti vengono create automaticamente.
- **Dedup**: prima di inserire una riga, si controlla se esiste già una spesa con la stessa
  combinazione data + importo + descrizione + categoria; in tal caso viene saltata. Ricaricare
  lo stesso CSV (o uno che si sovrappone a un caricamento precedente) non duplica le righe.
- **Dashboard** (`/spese`): andamento settimanale, ripartizione per categoria, confronto
  settimana corrente vs precedente, saldo netto (depositi − spese), tabella spese filtrabile.

## Deploy su Vercel

1. Collega il repository GitHub a un nuovo progetto Vercel.
2. In **Project Settings > Environment Variables**, aggiungi le stesse tre variabili di
   `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`) per l'ambiente Production (e Preview, se lo usi).
3. Deploy. Il piano Hobby di Vercel + il piano free di Supabase coprono questa fase a costo
   pressoché zero.

## Cosa manca volutamente in questa fase

Collezione carte, agenda, portfolio pubblico DBZ: non ancora sviluppati, per scelta (vedi
`AGENTS.md` del progetto per il contesto).
