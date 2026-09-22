# Archivio personale

Sito personale con area pubblica (portfolio, in arrivo) e area privata (spese, in questa fase).
Next.js (App Router) + Supabase + Vercel.

> Nota per chi tocca il codice con un assistente AI: questo progetto usa Next.js 16, con
> `middleware.ts` rinominato in `proxy.ts` (funzione `proxy()`). Vedi `AGENTS.md`/`CLAUDE.md`
> prima di modificare routing o auth.

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
- **Audit visivo dell'area privata (Radar) sui token del design system**: l'area privata già
  usava di default gli stessi token/utility del resto del sito (`--accent`, `.card`,
  `.btn-*`, `.field-input`, font Fraunces/Space Grotesk/JetBrains Mono, sidebar responsive a
  drawer su mobile); l'audit ha trovato solo poche macchie di colore hardcoded fuori palette
  (badge "da verificare" in `/spese/importa` e avvisi "Prepara" in `SessionRunner`, entrambi in
  giallo/ambra Tailwind di default) e le ha allineate al token `--accent` esistente, senza
  introdurre nuovi colori. Il testo bianco con contorno scuro nell'etichetta della ciambella
  investimenti (`AllocationChart`) resta invariato di proposito: deve restare leggibile sopra
  fette di colore arbitrario, non sopra `--surface`, quindi non è un token di tema.
- **Accento unico bordeaux su tutto il sito (non più ambra su `:root`/bordeaux solo su
  `.site-public`)**: `--accent` su `:root` (area privata) è stato allineato al bordeaux già
  usato dal sito pubblico (`#7e2537` chiaro / `#d4546d` scuro, foreground validati per
  contrasto — vedi commento su `.site-public` in `globals.css` per la provenienza del colore).
  Prima le due aree avevano hue diversi (ambra in privata, bordeaux in pubblica); ora l'accento
  è coerente ovunque, riducendo la palette invece di introdurne una terza. `.site-public`
  mantiene la propria dichiarazione di `--accent` (ora ridondante ma innocua) perché resta
  l'unico posto a isolare anche `--background`/`--surface`/`--border`/`--stamp`, propri solo
  del sito pubblico. I colori dedicati che riprendevano di proposito lo stesso hue dell'ambra
  (`--invest-etf`, `--agenda-personale`) sono lasciati invariati: sono token di categorizzazione
  indipendenti (hex propri, non `var(--accent)`), non l'accento del tema.

- **Snapshot storico in `pasti` (Fase A modulo Alimentazione)**: kcal/proteine/carboidrati/grassi
  su ogni riga di `pasti` sono calcolati una sola volta all'inserimento (quantità × valori/100g
  dell'alimento in quel momento) e non più ricalcolati da un join a `alimenti`, stesso principio
  già in uso in `sessioni_log` (modulo Allenamento) verso `scheda_esercizi`: se l'utente corregge
  un valore nel catalogo alimenti dopo aver loggato un pasto, i pasti già registrati non devono
  cambiare. `pasti.alimento_id` è `on delete set null` e `alimento_nome` è anch'esso uno snapshot,
  per restare leggibile anche se l'alimento originale viene rimosso dal catalogo. TDEE (Mifflin-St
  Jeor) e riepilogo giornaliero sono calcolati in TypeScript in `lib/alimentazione/queries.ts`,
  non con una vista SQL: nel repo non esiste un equivalente di "vista calcolata" per logica con
  più di un semplice join (il costo-base FIFO di Investimenti segue lo stesso principio). Fuori
  scope per questa fase, per scelta: integrazione con i giorni di allenamento del modulo workout,
  catalogo esterno/barcode/foto/AI, ricette/meal planning/lista della spesa, notifiche/promemoria.

- **PWA + Web Push (invece di Capacitor/React Native) per le notifiche su iPhone**: serve solo
  "svegliare" Lorenzo su alcuni eventi (es. token Google scaduto in Agenda) dal proprio telefono,
  non un'app nativa completa. Capacitor/React Native avrebbero richiesto un account sviluppatore
  Apple a pagamento, pubblicazione su App Store e una seconda codebase/pipeline di build da
  mantenere in parallelo al sito Next.js. Con una PWA installabile (già presente, vedi PR #30) +
  Web Push standard (VAPID, libreria `web-push`, nessun servizio esterno a pagamento tipo
  Firebase/OneSignal) restano un solo repo, un solo deploy (Vercel) e zero costi ricorrenti; il
  limite noto è che su iOS/iPadOS le notifiche funzionano solo dall'app aggiunta alla Home (Safari
  → Condividi → Aggiungi a Home, richiede 16.4+), non dal sito visitato nel browser. Vedi
  CLAUDE.md, sezione "PWA e notifiche push", per i dettagli implementativi.

- **Promemoria spese CSV "alla cieca" (nessun controllo se la settimana è già stata caricata)**:
  il flusso di import (manuale o via `/api/spese/importa/grezzo`) non ha un modo semplice e
  affidabile per sapere se "questa settimana" è già stata coperta — servirebbe una logica ad
  hoc solo per questo controllo. Il cron settimanale invia sempre il promemoria, stesso giorno
  ogni settimana: falso positivo occasionale (promemoria anche se già fatto) preferito a
  costruire un controllo di stato fragile. Renderlo condizionale (es. sull'ultima transazione
  importata) resta backlog, non implementato.
- **Nessun promemoria push per la colazione**: spesso saltata volontariamente (es. digiuno
  intermittente), a differenza di pranzo e cena che restano promemoria utili. Solo un'assunzione
  di Lorenzo, non un vincolo tecnico — si aggiunge come gli altri due se in futuro serve.

- **UI mobile dell'area privata: tab bar + font di sistema + `font-size: 100%` solo sotto
  `.app-shell` (invece di riscalare tutto il sito)**: usata quasi solo da iPhone come PWA
  installata, l'area privata web-adattata (hamburger/drawer, tabelle a scroll orizzontale,
  `text-xs` reale ~9,6px per via dell'`html { font-size: 80% }` ereditato dal sito pubblico)
  non dava un feeling da app nativa. La tab bar in basso (5 slot configurabili via
  `mobileTab` in `lib/sidebar-config.ts`, fonte unica con la sidebar desktop) sostituisce
  hamburger/drawer solo sotto `md`; il font di sistema (SF su iPhone) sostituisce
  Fraunces/JetBrains Mono solo dentro `.app-shell`, scelta voluta contro la linea generale
  "mai font di sistema" per il feeling nativo. Il ripristino al 100% del font-size è scoped a
  `html:has(.app-shell)` sotto 768px invece di toccare `html` globalmente, per non
  ingrandire il sito pubblico o il desktop dell'area privata. Il resto dei moduli (Carte,
  Agenda, Allenamenti, Alimentazione) eredita queste fondamenta ma non è stato ridisegnato
  pagina per pagina in questa fase: restano backlog ordinato (vedi PR).

## Cosa manca volutamente in questa fase

Collezione carte, agenda, portfolio pubblico DBZ: non ancora sviluppati, per scelta (vedi
`AGENTS.md` del progetto per il contesto).
