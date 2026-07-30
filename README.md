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

3. Nell'SQL Editor di Supabase, esegui **in ordine** tutti i file in `supabase/`:
   `schema.sql` → `002_spese_v2.sql` → `003_archivio_redesign.sql` →
   `004_import_excel.sql` → `005_gestione_movimenti.sql`. Ogni file ha un commento in testa
   che spiega cosa cambia; sono pensati per essere eseguiti una volta sola, in sequenza.

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

Quattro pagine sotto `/spese`, tutte dietro login:

- **`/spese` — Overview**: solo aggregati. Card entrate/uscite del periodo + saldo cumulativo
  da inizio tracciamento (non filtrato dal periodo), grafico ad area con l'andamento
  giornaliero delle spese, grafico a torta per categoria. Un'unica `FilterBar` (preset
  7/30 giorni/mese corrente + range personalizzato, più filtro categoria) è condivisa da
  entrambi i grafici.
- **`/spese/gestione` — Gestione**: tabella con ricerca testuale (titolo/descrizione), filtro
  categoria/tipo/data, paginazione (50 righe/pagina), modifica (modale) ed eliminazione
  (con conferma) per ogni movimento. Legge dalla view `movimenti_con_categoria` (spese +
  depositi unificati in sola lettura); le modifiche scrivono sempre sulla tabella originale
  tramite `/api/movimenti/[tipo]/[id]`.
- **`/spese/importa` — Import Excel**: carica un file `.xlsx` con struttura fissa
  (`tipo, data, importo, categoria, titolo, descrizione, nominativo, dettaglio, fonte`,
  generato da una chat Claude dedicata fuori da questa repo, non dal sito). Le righe che non
  rispettano le liste ammesse vengono segnalate riga per riga senza bloccare le altre. Le righe
  già presenti in `spese`/`depositi` (stessa combinazione data+importo+titolo+fonte) sono
  marcate "già presente" e deselezionate di default in anteprima, ma restano forzabili a mano.
  Solo le righe selezionate vengono scritte, e solo al click su "Conferma e importa".
- **`/spese/nuovo` — Aggiungi movimento**: form diretto (spesa o entrata) per inserimenti
  manuali, `fonte = 'manuale'`.

`fonte` non è mai enfatizzata in Overview (compare solo, in piccolo, nella tabella Gestione):
serve solo internamente a distinguere l'origine del dato (`crypto`, `intesa`, `manuale`).

## Deploy su Vercel

1. Collega il repository GitHub a un nuovo progetto Vercel.
2. In **Project Settings > Environment Variables**, aggiungi le stesse tre variabili di
   `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`) per l'ambiente Production (e Preview, se lo usi).
3. Deploy. Il piano Hobby di Vercel + il piano free di Supabase coprono questa fase a costo
   pressoché zero.

## Decision log

- **Split Overview/Gestione (invece di un'unica dashboard)**: la vista combinata rendeva la
  pagina principale pesante e mischiava due compiti diversi ("quanto ho speso" vs "correggi
  questa riga"). Overview resta sola lettura e leggera (nessuna tabella, solo aggregati);
  Gestione è l'unico posto con CRUD completo, così le due responsabilità non si mischiano più
  nello stesso componente.
- **Import Excel pre-categorizzato (non più CSV grezzo + categorizzazione automatica)**: le
  versioni precedenti importavano CSV grezzi di Crypto.com/Intesa Sanpaolo e provavano a
  categorizzare automaticamente lato server (euristica a parole chiave). In pratica la
  maggior parte delle righe finiva comunque in "Altro" (per Crypto.com sempre, non avendo
  categoria bancaria). La categorizzazione è stata spostata in una chat Claude dedicata fuori
  dal sito, che restituisce un file Excel già pronto in un formato fisso: il sito si limita a
  validare e importare, senza più logica di categorizzazione lato server.
- **La torta "spese per categoria" può mostrare quasi solo "Altro" anche a codice corretto**:
  non è un bug di join né di mapping (verificato: `categoria_id` non è mai null, le 12
  categorie esistono con nomi esatti, l'import rifiuta esplicitamente le righe con categoria
  non riconosciuta invece di forzarle su "Altro"). La causa è che i dati attualmente in tabella
  precedono il flusso di import Excel attuale — sono il risultato del remap della migrazione
  003 da un set di 12 categorie generiche a quello attuale più corto, dove gran parte delle
  vecchie categorie bancarie non ha equivalente diretto. Finché non si importa un file Excel
  vero tramite `/spese/importa` (o si ricategorizzano le righe storiche da Gestione), la torta
  riflette correttamente questo stato, non lo nasconde.
- **Dedup sull'import (chiave data+importo+titolo+fonte)**: introdotto perché la chat di
  categorizzazione esterna può ricevere in input export che si sovrappongono a import
  precedenti (es. un nuovo estratto conto che riparte da una data già coperta). Deselezionare i
  duplicati di default invece di bloccarli evita sia i doppioni silenziosi sia falsi positivi
  bloccanti — l'utente vede cosa viene marcato come duplicato e decide riga per riga.
- **`categorie.colore` come riferimento a variabile CSS** (`var(--cat-alimentari)` ecc.) e non
  come hex fisso: mantiene i colori coerenti tra tema chiaro/scuro senza duplicare la palette
  nel database.

## Cosa manca volutamente in questa fase

Collezione carte, agenda, portfolio pubblico DBZ: non ancora sviluppati, per scelta (vedi
`AGENTS.md` del progetto per il contesto).
