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
```

Non esiste una test suite (nessun runner configurato in `package.json`).

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
  `/alimentazione`, `/impostazioni`, `/altro`, `/login`, `/api/*`) → gestite da
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
- `/api/cron/update-portfolio-prices` — aggiorna prezzi investimenti
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
