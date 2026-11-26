# Collaudatore (e2e)

Controlli strutturali sull'area privata vista da un iPhone (390×844), fatti con l'utente
**tester in sola lettura** (vedi CLAUDE.md > "Tester in sola lettura"). Mai asserzioni su
importi o contenuti: sono dati reali.

Per ogni pagina privata: si apre senza rimandare al login, PageHeader e tab bar visibili,
nessuno scroll orizzontale, tap target della tab bar ≥ 44px, nessun testo sotto i 12px, nessun
errore JS/console, nessun 404/5xx. Più il flusso feedback (pressione lunga → sheet → Annulla).

In CI: `.github/workflows/collaudo.yml` (a ogni deploy di produzione e ogni notte; le anteprime no).
Ogni giro consuma i limiti del piano gratuito Vercel (sito sospeso il 21/11/2026): in locale usa
`-g` o un solo file, e non aggiungere test che ricaricano una pagina già visitata (il controllo a
375px restringe la stessa pagina). Se il sito risponde 402 il giro si ferma subito.

In locale:

```bash
E2E_BASE_URL=https://tuo-sito SUPABASE_URL=... SUPABASE_ANON_KEY=... \
TESTER_EMAIL=... TESTER_PASSWORD=... npm run test:e2e
```

Pagina nuova nell'area privata → aggiungila a `PAGINE` in `pagine.spec.ts`. Bug corretto →
aggiungi un test che fallisce prima e passa dopo.
