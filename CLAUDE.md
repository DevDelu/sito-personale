# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Cosa è questo progetto

Sito personale con area pubblica (portfolio bilingue IT/EN, in arrivo) e area privata a singolo
utente (Lorenzo): spese, investimenti, carte, allenamenti, agenda, quiz pubblico in homepage.
Next.js (App Router) + Supabase + Vercel.

## Comandi

```bash
npm install       # setup
npm run dev        # dev server, http://localhost:3000
npm run build       # build produzione
npm run start       # avvia build produzione
npm run lint         # eslint (eslint-config-next core-web-vitals + typescript)
npm test            # unit test node:test su lib/**/*.test.ts e .github/scripts/*.test.mjs (Node 22, nessun runner)
npm run check:fb-aree  # ogni pagina privata ha aree di feedback, tutte presenti in lib/feedback/aree.ts
npm run test:e2e    # collaudatore Playwright sul sito vero col tester in sola lettura (vedi tests/e2e/README.md)
```

Gli unit test importano con estensione `.ts` (serve a Node), da qui `allowImportingTsExtensions` in
`tsconfig.json`. Il collaudatore (`tests/e2e/`, `.github/workflows/collaudo.yml`) gira a ogni deploy
Vercel e ogni notte; entra come tester con `signInWithPassword` via `@supabase/ssr` (niente form di
login, che ha Turnstile). Vede dati reali in un repo pubblico: **mai** screenshot/video/trace o
report caricati come artifact, e asserzioni solo strutturali. Pagina privata nuova → aggiungila a
`PAGINE` in `tests/e2e/pagine.spec.ts`; bug corretto → test che fallisce prima e passa dopo.

Setup Supabase locale: crea un progetto free su supabase.com, esegui **in ordine** tutte le
migration in `supabase/` (numerate, partendo da `schema.sql`), crea manualmente l'utente in
Authentication > Users (nessun flusso di registrazione pubblico), copia `.env.example` in
`.env.local` e compila le variabili (vedi i commenti in `.env.example` per cosa serve ognuna:
Supabase, `OWNER_EMAIL`, `CRON_SECRET`, Resend per le email, Turnstile anti-bot).

## Architettura

### Routing: `proxy.ts`, non `middleware.ts`

Questo progetto usa Next.js 16, dove il middleware è stato rinominato **proxy** —
`proxy.ts` in root (non `middleware.ts`) esporta una funzione `proxy()`, non `middleware()`.
Tienilo a mente prima di toccare routing/auth: cercare `middleware.ts` o la funzione
`middleware()` in questa repo non troverà nulla.

`proxy.ts` fa da router tra due sistemi:
- Rotte **non localizzate** (`/spese`, `/investimenti`, `/carte`, `/allenamenti`, `/agenda`,
  `/alimentazione`, `/impostazioni`, `/altro`, `/feedback`, `/login`, `/api/*`) → gestite da
  `updateSession()` in `lib/supabase/proxy.ts` (refresh sessione
  Supabase).
- Tutto il resto (area pubblica sotto `app/[locale]/`) → middleware `next-intl` per il routing
  bilingue.

### Auth e autorizzazione a due livelli

- **Autenticato** (`getUser()` in `lib/supabase/dal.ts`): qualunque sessione Supabase valida,
  incluso chi ha fatto login Google solo per il quiz pubblico in homepage.
- **Owner** (`requireUser()` in `lib/supabase/dal.ts` + `isOwner()` in `lib/supabase/owner.ts`):
  confronta l'email della sessione con `OWNER_EMAIL`. Tutta l'area privata (`app/(private)/*`)
  chiama `requireUser()` nel layout, non solo un controllo "loggato" — altrimenti un giocatore
  del quiz con login Google otterrebbe accesso alle pagine private.
  `isOwner()` è in un file separato senza `import "server-only"` perché è condiviso sia da
  `dal.ts` (Server Component/Action) sia da `proxy.ts` (edge runtime).
- **API private: controllo centrale nel proxy** (`updateSession()` in `lib/supabase/proxy.ts`):
  ogni `/api/*` richiede l'owner, tranne `API_AUTONOME` (quiz multi-utente, cron e
  `/api/feedback/agente` con secret Bearer verificato nella route). Una route nuova è quindi
  protetta di default; se deve essere pubblica o a secret va aggiunta ad `API_AUTONOME`. Prima
  molte route controllavano solo `getUser()`, cioè qualunque sessione (anche un giocatore del quiz).
- **Tester in sola lettura** (`isTester()`, env `TESTER_EMAIL`): l'utente degli agenti notturni.
  Apre tutte le pagine private (`requireUser()` lo accetta) e fa GET sulle API, ma il proxy rifiuta
  ogni sua richiesta non GET/HEAD (Server Action comprese) e le rotte in `API_VIETATE_AL_TESTER`
  (OAuth Google, lettura email). Le Server Action usano `requireWriter()` (solo owner) come
  seconda barriera: nelle action nuove usa sempre `requireWriter()`, non `requireUser()`.

### i18n

`i18n/routing.ts` definisce le locale (`it` default, `en`) con `next-intl`, prefisso URL
`as-needed` (IT senza prefisso, EN con `/en`). Solo l'area pubblica sotto `app/[locale]/` è
localizzata; l'area privata e le route elencate in `UNLOCALIZED_PREFIXES`/`UNLOCALIZED_EXACT_ROUTES`
in `proxy.ts` restano fuori dal routing next-intl.

### Struttura per dominio

`app/(private)/<dominio>`, `components/<dominio>/`, `hooks/use<Dominio>Mutations.ts`,
`lib/<dominio>/{queries,types}.ts`, `app/api/<dominio>/` seguono lo stesso pattern per ogni
dominio (spese, investimenti, carte, allenamento, agenda, quiz). Le query/scritture verso
Supabase vivono in `lib/<dominio>/queries.ts`, mai inline nei componenti.

### Cron job (Vercel)

Tre cron definiti in `vercel.json`, protetti da `CRON_SECRET` (header
`Authorization: Bearer <CRON_SECRET>` — se assente in env, le route restano invocabili senza
auth, vedi commento in `.env.example`):
- `/api/cron/update-portfolio-prices` — aggiorna prezzi investimenti. Stessa logica
  (`aggiornaPrezzi()` in `lib/investimenti/aggiorna-prezzi.ts`) anche on demand: `/investimenti`
  chiama `POST /api/investimenti/aggiorna-prezzi` all'apertura se l'ultimo aggiornamento ha più
  di 15 minuti (il piano Hobby permette un solo cron al giorno, troppo poco da solo)
- `/api/agenda/cron-sync` — sync agenda Google, notifica via email (Resend) se il refresh token
  è scaduto
- `/api/agenda/note-reminder` — reminder note agenda

### PWA e notifiche push

Il sito è installabile come PWA (`public/manifest.webmanifest`, `public/sw.js`,
`components/service-worker-register.tsx`). `public/sw.js` è **l'unico service worker del
progetto**: non crearne un secondo, estendere quello esistente (fetch pass-through, nessuna
cache/offline, più i handler `push`/`notificationclick`).

Le notifiche push usano Web Push standard (VAPID, libreria `web-push`), nessun servizio esterno
a pagamento. `lib/push/send.ts` (`sendPushToOwner()`) è **l'unico punto di invio** di tutto il
progetto: qualunque funzionalità futura che debba notificare Lorenzo (reminder pasti, alert
token Google scaduto, digest agenda...) chiama questa funzione, non `web-push` direttamente.
Oltre alla pagina `/impostazioni` (pulsante di prova), i casi d'uso reali collegati sono i cron
di notifica e l'alert di sicurezza — vedi "Cron notifiche" sotto.

Punti da tenere a mente:
- **Permesso solo da gesto utente**: `Notification.requestPermission()` va chiamato solo dentro
  un handler di click esplicito (`components/push/PushSettings.tsx`), mai all'avvio della pagina
  — Safari/iOS lo bloccherebbero.
- **Ogni push deve mostrare una notifica**: su iOS un push che non chiama
  `showNotification()` porta il sistema a revocare la subscription. Il handler `push` in
  `public/sw.js` chiama sempre `showNotification()`, anche a scopo di test.
- **Env var VAPID** (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` —
  quest'ultima fallback a `mailto:` + `AGENDA_ALERT_EMAIL` se assente, vedi `.env.example`):
  generate con `npx web-push generate-vapid-keys`. Se mancano (o manca la tabella
  `push_subscriptions`, migration `030_push_subscriptions.sql`), `sendPushToOwner()` restituisce
  `{ ok: false, reason: ... }` invece di lanciare — build, altre pagine e le route
  `app/api/push/*` restano funzionanti, la UI in `/impostazioni` mostra "non configurato".
- **Owner-only**: tutte le route `app/api/push/*` controllano `getUser()` **+**
  `isOwner(user.email)`, non solo la sessione — un giocatore del quiz con login Google ha
  comunque una sessione Supabase valida (vedi sopra). `runtime = "nodejs"` obbligatorio (web-push
  non gira su Edge).

#### Cron notifiche

Cinque cron in più (`vercel.json`), oltre ai tre di "Cron job" sopra, agganciati a
`sendPushToOwner()` (più un push non-cron sul login sospetto). Stesso pattern
`CRON_SECRET`/`Authorization: Bearer` delle altre route cron: se `CRON_SECRET` non è impostata,
restano invocabili senza autenticazione (vedi commento in `.env.example`).

Singolo utente (Lorenzo è l'unico owner): nessun filtro `user_id` nelle query di questi cron,
stesso principio già usato da `sendPushToOwner()`.

- `/api/cron/alimentazione/pranzo-non-loggato` — `30 12 * * *` (≈14:30 Italia). Push se non
  esiste ancora un pasto `tipo = 'pranzo'` per oggi (fuso Europe/Rome, vedi
  `lib/cron/data-italia.ts`).
- `/api/cron/alimentazione/cena-non-loggata` — `30 19 * * *` (≈21:30 Italia). Stessa logica per
  `tipo = 'cena'`.
- `/api/cron/alimentazione/peso-settimanale` — `0 7 * * 0`, domenica (≈09:00 Italia). Push se
  manca una pesata nella settimana corrente (lun-dom, Europe/Rome).
- `/api/cron/alimentazione/kcal-soglia` — `0 21 * * *` (≈23:00 Italia). Confronta le kcal
  loggate oggi con il target TDEE (`getRiepilogoTdee()`): push solo se lo scarto supera il 20%
  del target (costante `SOGLIA_SCOSTAMENTO_PERCENTUALE` in cima al file, non env). Zero pasti
  loggati oggi → nessun push (già coperto dai due promemoria pasto sopra, evita doppioni).
- `/api/cron/spese/promemoria-csv` — `0 16 * * 0`, domenica (≈18:00 Italia). Promemoria "alla
  cieca" per l'upload CSV: nessun controllo se questa settimana è già stata caricata (il flusso
  di import non ha un modo affidabile per saperlo, vedi decision log nel README).
- **Alert push login sospetto** (`app/login/actions.ts`, `inviaAvvisoTentativiSospetti`): non è
  un cron. Quando scatta il rate-limit del login, subito dopo l'email via Resend già esistente
  parte anche `sendPushToOwner()` con lo stesso IP nel corpo. Stessa finestra/deduplica
  dell'email (una notifica ogni 15 minuti, non una per tentativo bloccato).

Nota sull'ora: i cron Vercel girano in UTC fisso, senza fuso — gli orari sopra sono calcolati
sull'ora legale italiana (CEST, UTC+2); con il passaggio a UTC+1 (fine ottobre) l'orario reale
slitta di un'ora. Accettabile dato che l'imprecisione di schedulazione di Vercel Cron è già di
±59 minuti sul piano Hobby.

### UI mobile (area privata, PWA iOS)

Sotto `768px`, l'area privata ha un aspetto da app iOS nativa invece del sito web adattato
(hamburger + drawer, tabelle a scroll orizzontale). Tutto lo stile nuovo è scoped alla classe
`.app-shell` (sul wrapper di `app/(private)/layout.tsx`, riusata anche da `/login`,
`/login/recupera-password` e `/reset-password`) combinata con `< md`: il sito pubblico e il
layout desktop dell'area privata non cambiano.

- **`html { font-size: 80% }`** (`app/globals.css`, sito pubblico) è riportato al 100% solo
  sotto `768px` quando `.app-shell` è nel DOM (`html:has(.app-shell)`), altrimenti `text-xs`
  risulterebbe ~9,6px reali. Se aggiungi una pagina privata nuova, verificala a 390px e 375px
  cercando overflow orizzontale: eredita l'ingrandimento automaticamente.
- **Scala tipografica iOS** (ora a rem = px reali, vedi sopra): titolo grande 32px bold,
  titolo sezione 22px, corpo/campi 17px, secondario 15px, nota 13px, tab bar 11px. **Nessun
  testo sotto i 12px** tranne le etichette della tab bar.
- **Font di sistema** (`-apple-system, "SF Pro Text", system-ui`) sostituisce
  Fraunces/Space Grotesk/JetBrains Mono solo dentro `.app-shell`: scelta voluta per il
  feeling nativo, non estenderla al sito pubblico o al desktop.
- **Tab bar mobile** (`components/shell/TabBar.tsx`, `md:hidden`): 5 slot, definiti da
  `mobileTab: true` su `lib/sidebar-config.ts` (fonte unica con la sidebar desktop — cambiare
  quali moduli hanno lo slot è una riga). Rispetta `interceptSessionNav` (nav guard
  allenamento) e si nasconde su `/allenamenti/sessione/*`. Le sezioni senza slot dedicato
  (Carte, Agenda, Impostazioni) più le azioni di account (tema, area pubblica, esci) vivono in
  `/altro` (`app/(private)/altro/page.tsx`) — vedi la gotcha sotto.
- **Gotcha `/altro`**: come ogni rotta nuova dell'area privata, va aggiunta **sia** a
  `UNLOCALIZED_PREFIXES` in `proxy.ts` **sia** a `PROTECTED_PREFIXES` in
  `lib/supabase/proxy.ts` (vedi "Routing" sopra), altrimenti `next-intl` la intercetta (404) o
  la protezione a due livelli si rompe.
- **Primitive obbligatorie per i nuovi moduli mobile** (`components/ui/`): `PageHeader`
  (barra sticky con titolo grande, azione a destra, back con chevron), `SegmentedControl`
  (sottosezioni di modulo, da `SIDEBAR_SECTIONS[...].subsections`), `Sheet` (bottom sheet con
  trascinamento per chiudere, blocco scroll body, `dvh`, chiusura Esc — sostituisce i
  `modal-overlay`/`modal-panel` grezzi nei modali dell'area privata), `ListGroup`/`ListRow`
  (liste raggruppate stile Impostazioni iOS), `ActionBar` (barra fissa sopra la tab bar per
  la selezione multipla).
- **Modulo modello: Spese** (`app/(private)/spese/*`, `components/spese/*`). Gli altri moduli
  (Investimenti, Carte, Allenamenti, Agenda, Alimentazione) ereditano le fondamenta e la tab
  bar ma non sono stati ridisegnati pagina per pagina: vanno affrontati uno alla volta con lo
  stesso schema, non "per completezza" senza che sia richiesto.

### Feedback (Radar, POTENZIAMENTO 1 + ciclo chiuso)

Lorenzo lascia un feedback in meno di 5 secondi, senza ingombro visivo permanente. Più accessi,
tutti verso lo stesso sheet (`components/feedback/FeedbackSheet.tsx`, ospitato da
`FeedbackProvider` nel layout privato e aperto via `apriFeedback()` in `lib/feedback/bus.ts`):
- **Pressione lunga (~500 ms) sulla tab già attiva** della tab bar (`hooks/usePressioneLunga.ts`).
  Su una tab non attiva resta un tap normale. Lo sheet si apre al timer; il focus al campo
  arriva al `touchend` perché iOS apre la tastiera solo dentro un gesto utente — non spostarlo
  nel timer. Un suggerimento di scoperta compare una sola volta (flag in localStorage).
- **Suggerimento dopo un attrito** ("Qualcosa non va? Dimmelo", sopra la tab bar, 4 s): oggi
  scatta su `errore_api` (risposte 5xx da `/api/*`, via `fetch` osservata) ed `errore_js`; gli
  altri tipi arriveranno col tracciamento d'uso. Regole anti-invadenza pure e testate in
  `lib/feedback/regole-suggerimento.ts`.
- **Pulsante su ogni pagina** (`FeedbackPulsante`, montato da `FeedbackProvider`, origine `pulsante`,
  migration 032): il feedback prende come riferimento la pagina in cui è toccato. Mobile in basso a
  sinistra sopra la tab bar (i FAB delle pagine stanno a destra), desktop in basso a destra; nascosto
  con sheet/avvisi aperti e in `/allenamenti/sessione/*`.
- **Riserva**: riga in `/altro` (allega l'ultima pagina visitata prima di Altro), voce "Feedback"
  in fondo alla sidebar desktop, scorciatoia `F` senza campi a fuoco.

Su mobile lo sheet scende **dall'alto** (`<Sheet posizione="alto">`): ancorato in basso veniva
coperto dalla tastiera iOS, che si apre subito.

Su desktop la scorciatoia `F` funziona anche con un modale aperto (ne cattura l'area). Su iPhone i
modali coprono la tab bar (overlay `z-50` sopra la tab bar `z-30`): con un modale aperto la
pressione lunga sulla tab non è raggiungibile.

#### Dove: contesto preciso

- **Aree nominate**: `data-fb-area="modulo.pagina.sezione"` sulle sezioni principali di ogni pagina
  privata (wrapper `<div ... className="contents">`, nessun effetto sul layout), `area` obbligatoria
  su ogni `<Sheet>` e `data-fb-area` sul `.modal-panel` dei modali grezzi. Etichette leggibili
  **solo** in `lib/feedback/aree.ts`. Sui dati: `data-fb-entita="tipo:id"` (solo tipo e id).
  `npm run check:fb-aree` (in `.github/workflows/ci.yml`) fallisce se una pagina privata non ha
  aree o se un'area usata non è in `aree.ts`: **pagina/modale nuovo → aggiungi area e etichetta**.
  Pagina senza UI (solo redirect): commento `// fb-aree: <motivo>`.
- **Cattura all'apertura** (`lib/feedback/cattura.ts`): `route` template, `url` reale (path +
  query, resta solo in Supabase), `area` (lo Sheet/modale aperto più in alto, altrimenti
  l'elemento al centro dello schermo → `closest('[data-fb-area]')`), `entita`, `scroll_y`. Da
  `/altro` vale l'ultima pagina visitata.
- **"Indica il punto"**: lo sheet si smonta, barra "Tocca l'elemento · Annulla", il tap successivo
  è intercettato in capture su `window` (non attiva l'elemento). Salva `punto` (ruolo, etichetta
  max 60 caratteri con cifre → `#`, selettore stabile, posizione %). Nessuno screenshot.
- **Doppioni**: se sulla stessa `route` ci sono feedback non chiusi, lo sheet lo dice; sceglierne
  uno trasforma il testo in una nota (`nota_per`) invece di un feedback nuovo.

#### Stati e storico

```
nuovo → preso-in-carico → in-lavorazione → da-verificare → verificato
              ↓                 ↓               ↓
         serve-info ←───────────┘           riaperto → preso-in-carico
qualsiasi stato non chiuso → scartato (solo Lorenzo)
```

Matrice esplicita in `lib/feedback/stati.ts` (testata), usata da `cambiaStato()` in
`lib/feedback/queries.ts`: nessuna route scrive `stato` direttamente, ogni cambio scrive una riga
in `feedback_eventi` (timeline: `cambio-stato`/`nota`/`domanda`/`risposta`/`nota-fix`). Due
aggiunte rispetto al disegno: `in-lavorazione → preso-in-carico` (PR chiusa senza merge) e
`riaperto → in-lavorazione` (PR aperta prima del job notturno). Migration `033_feedback_ciclo.sql`
(rimappa gli stati di 031: `in-lavorazione` senza PR → `preso-in-carico`, `risolto` →
`da-verificare`). RLS come le altre tabelle: default-deny, accesso solo server-side.

- **Lorenzo** (Server Action in `app/(private)/feedback/actions.ts`, `requireWriter()`):
  `verificato`, `riaperto`, `scartato`, risposta a `serve-info`, note, testo modificabile solo da
  `nuovo`.
- **Agenti**: `POST /api/feedback/agente` (PATCH alias) con `Authorization: Bearer
  <FEEDBACK_AGENTE_SECRET>` (alias `FEEDBACK_AGENT_SECRET`, obbligatoria, fail-closed):
  `preso-in-carico`, `serve-info` (con domanda in `testo`), `in-lavorazione`, `nota-fix`,
  `{ riportati: [...] }`. `verificato`/`scartato` → **403**. `GET ?stato=...` e
  `GET ?eventi=da-riportare`.
- **Sistema**: `.github/workflows/feedback-deploy.yml` su `deployment_status` (Production,
  success): feedback `in-lavorazione` con PR mergiata **e contenuta nello SHA deployato** →
  `da-verificare` (`autore: "sistema"`). `.github/workflows/feedback-pr.yml`: PR aperta →
  `in-lavorazione`; mergiata → `nota-fix` dalla riga `Nota per Lorenzo: ...` del corpo PR;
  chiusa senza merge → `preso-in-carico`.

#### Ciclo di verifica

Quando un feedback è `da-verificare` e Lorenzo apre la sua `route`, `FeedbackProvider` evidenzia
per 2 s il punto indicato (contorno ambra) e mostra sopra la tab bar "Avevi segnalato un problema
qui. È sistemato?" con la `nota-fix` sotto. Sì → `verificato`; No → `riaperto` + sheet "Cosa non va
ancora?" (facoltativo, diventa nota). Regole in `lib/feedback/regole-verifica.ts`: 1 avviso per
sessione, mai in `/allenamenti/sessione/*`, con un campo in focus o sopra uno Sheet; sparisce
dopo 6 s. Solo owner (il tester non lo vede). Nessuna chiusura automatica.

Pagina **`/feedback`** (da `/altro`, con contatore di quelli che aspettano Lorenzo, e dalla sidebar
desktop): schede **Per te** (domanda dell'agente, PR da approvare = `in-lavorazione` con PR, da
verificare) / In corso / Chiusi, percorso a 5 passi e frase "Adesso" per ogni feedback
(`lib/feedback/fasi.ts`, testata), testo integrale, card con area leggibile ed età, Sheet di
dettaglio con contesto, "Vai al punto", timeline, link issue/PR e azioni; card riepilogo (contatori,
tempo medio fino a `verificato`, tasso di riapertura).

#### Job notturno feedback → issue

`.github/workflows/radar-feedback-notte.yml` (01:23 UTC, più avvio manuale da Actions): legge i
feedback `nuovo`, quelli `riaperto` e le note/risposte di Lorenzo non ancora riportate; Claude Code
(`claude -p` col token dell'abbonamento, `CLAUDE_CODE_OAUTH_TOKEN`) scrive titoli e parafrasi in
`.radar-tmp/proposte.json` seguendo `.github/scripts/prompt-feedback-notte.md`, poi
`.github/scripts/feedback-notte.mjs pubblica` crea le issue `dal-lorenzo` (→ `preso-in-carico`),
riapre quelle dei riaperti con etichetta `riaperto` (`ostinato` dalla 2ª riapertura) e riporta le
note parafrasate. Il repo è **pubblico**: Claude gira senza token GitHub, secret del sito, Bash o
rete, il suo output non va nei log. Nella issue vanno solo route template, etichetta dell'area,
ruolo/etichetta dell'elemento (senza cifre né valute), **tipo** di entità e parafrasi
(`.github/scripts/feedback-issue.mjs`, testato in `feedback-issue.test.mjs`); `url`, id
dell'entità e testi originali restano in Supabase. Ogni parafrasi passa da
`.github/scripts/privacy.mjs` (importi, valute, date, email, numeri lunghi, 6+ parole copiate →
testo generico che rimanda a Supabase). Idempotente: il marcatore `<!-- feedback-id -->` evita
doppioni. Nelle notti senza testi da parafrasare Claude non parte (niente quota).

Se Claude non riesce a parafrasare (es. `CLAUDE_CODE_OAUTH_TOKEN` scaduto) le issue escono col corpo
generico e il job diventa **rosso** (email di GitHub), non più verde in silenzio.

#### Sviluppatore notturno (feedback → PR)

Le issue sono solo il registro pubblico: **chi sistema i feedback legge il testo originale da
Supabase**, mai la parafrasi. `scripts/feedback.mjs` (`elenco`, `mostra <id>` con tutta la storia,
`stato`, `domanda`) chiama `GET /api/feedback/agente` (`?stato=tutti`, `?id=<uuid>` con eventi) con
`RADAR_URL` + `FEEDBACK_AGENTE_SECRET`: in una sessione Claude Code con queste variabili "cosa ho
scritto nei feedback?" ha una risposta esatta. Stampa testi privati: mai in Actions.

Procedura in `.claude/skills/sviluppatore-feedback/SKILL.md`, eseguita da una **Routine di Claude Code**
(sessione cloud privata, ogni notte dopo il job delle issue, avviabile anche a mano da claude.ai/code →
Routines → Run now): coda riaperti → presi in carico → nuovi; per ognuno o una domanda
(`serve-info`) o una PR da `main` con `Feedback-id: <uuid>` e `Nota per Lorenzo:` nel corpo (più
`Closes #N` se c'è la issue). `feedback-pr.yml` collega la PR al feedback dalle righe `Feedback-id`
(precedenza sulle issue chiuse, così funziona anche per feedback lavorati di giorno, senza issue). Lorenzo
approva facendo merge; dopo il deploy il feedback è "Da verificare". Mai merge né stati di Lorenzo.

Testi lunghi (dettatura): 5000 caratteri per feedback e note (migration `034_feedback_testo_lungo.sql`);
senza 034 `inserisciFeedback()`/`aggiungiEvento()` spezzano il testo invece di perderlo
(`lib/feedback/testo.ts`). Con lo sheet di feedback (e i campi del dettaglio) aperti lo schermo resta
acceso (`useWakeLock`, richiesto anche al tocco del campo perché iOS lo vuole da un gesto): la dettatura
non si interrompe più per il blocco automatico.

Priorità e convenzioni per gli agenti che sistemano i feedback: `docs/agenti-da-fare.md`.

### Decision log (dal README)

- **Overview/Gestione separate in Spese**: Overview è sola lettura (aggregati, grafici);
  Gestione è l'unico posto con CRUD. Evita di mischiare le due responsabilità nello stesso
  componente.
- **Import Excel pre-categorizzato**: la categorizzazione (ex-CSV grezzo + euristica
  automatica, che finiva quasi sempre in "Altro") è stata spostata in una chat Claude dedicata
  fuori da questa repo; il sito valida e importa un file Excel già pronto in formato fisso,
  senza più logica di categorizzazione lato server.
- **Dedup import su data+importo+titolo+fonte**: deselezionato di default ma forzabile a mano,
  non bloccante — evita sia doppioni silenziosi sia falsi positivi.
- **`categorie.colore` come riferimento a variabile CSS** (`var(--cat-...)`), non hex fisso: colori
  coerenti tra tema chiaro/scuro senza duplicare la palette nel database.

Collezione carte, agenda, allenamenti e portfolio pubblico sono in sviluppo attivo/parziale per
scelta, non per dimenticanza — non aggiungerli "per completezza" senza che sia richiesto.
