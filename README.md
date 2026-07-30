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

3. Nell'SQL Editor di Supabase, esegui in ordine:
   - [`supabase/schema.sql`](supabase/schema.sql) — tabelle `categorie`, `spese`, `depositi`,
     view `spese_con_categoria`.
   - [`supabase/002_spese_v2.sql`](supabase/002_spese_v2.sql) — colonne `titolo`,
     `categoria_banca`, `fonte` (su `depositi`), e le 12 categorie definitive (sostituiscono i
     placeholder iniziali).

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

`/spese/upload` supporta tre sorgenti, selezionabili nella pagina:

- **CSV generico** — colonne `importo`, `data` (obbligatorie), `descrizione`, `categoria`
  (opzionali; alias accettati: `amount`, `date`). Categorie non esistenti vengono create
  automaticamente. Dedup su data + importo + descrizione + categoria.
- **Crypto.com** — export CSV standard. Righe `EUR Deposit` e `Refund:` vengono escluse
  (non sono spese reali); solo gli importi negativi diventano spese, categoria di default
  "Da categorizzare". Dedup su Timestamp + Transaction Description + Amount.
- **Intesa Sanpaolo** — export Excel "Lista Operazione". Cerca automaticamente la riga di
  intestazione (non assume una posizione fissa). Giroconti e bonifici verso te stesso vengono
  esclusi; le categorie della banca sono mappate sulle 12 categorie app (vedi
  `lib/parsers/intesa.ts`, fallback "Da categorizzare" se non mappata); importi positivi vanno
  in `depositi`, negativi in `spese`. Dedup su Data + Operazione + Dettagli + Importo.

**Inserimento manuale (es. PayPal, contanti)**: non avviene dal sito — è previsto tramite un
Project Claude dedicato (fuori da questa repo) con un tool collegato direttamente a Supabase.
Le colonne `spese.titolo`/`spese.fonte` e `depositi.titolo`/`depositi.fonte` sono già pronte per
riceverlo; la configurazione del Project/tool va fatta manualmente su claude.ai.

**Dashboard** (`/spese`): entrate/uscite/saldo netto nel periodo, confronto settimana corrente
vs precedente, andamento settimanale, entrate vs uscite mensili, ripartizione uscite per fonte,
ripartizione per categoria, tabella spese filtrabile.

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
