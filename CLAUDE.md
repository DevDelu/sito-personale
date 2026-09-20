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
  `/login`, `/api/*`) → gestite da `updateSession()` in `lib/supabase/proxy.ts` (refresh sessione
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
Nessun caso d'uso reale è ancora collegato: solo la pagina `/impostazioni` con un pulsante di
prova.

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
