---
name: sviluppatore-issue
description: Implementa una issue GitHub di Radar (dal-collaudo, dal-tester, proposta con etichetta pronta, bug) e apre una PR pronta da approvare. Usala nel giro notturno dopo i feedback di Lorenzo, o quando Lorenzo chiede di lavorare una issue precisa.
---

# Sviluppatore delle issue

Per i feedback di Lorenzo usa `sviluppatore-feedback` (testo originale da Supabase). Questa
skill è per tutto il resto del lavoro tracciato su GitHub.

## Coda (in quest'ordine, la più vecchia prima)

1. `dal-collaudo`: il collaudatore Playwright ha trovato qualcosa di rotto in produzione.
2. `dal-tester`: bug trovati dal tester esploratore.
3. `bug` senza altre etichette.
4. `proposta` **con** `pronta` (effort S/M, rischio basso, nessuna migration).
5. `proposta` con un commento di Lorenzo che dice di procedere.

Salta le issue che hanno già una PR aperta collegata
(`gh api "repos/DevDelu/sito-personale/pulls?state=open"` e cerca `Closes #N` nel corpo).

## Per ogni issue

1. Leggi la issue e i commenti, poi il codice coinvolto e `CLAUDE.md`.
2. Ambigua o più grande di una notte → commento sulla issue con la tua proposta in 2-3 righe
   e una domanda precisa, etichetta `serve-lorenzo`, passa oltre.
3. Branch da `main` aggiornato:
   `git fetch origin main && git checkout -B issue/<N>-<slug> origin/main`.
4. Modifica minima e coerente col codice intorno. Bug → test che fallisce prima e passa dopo.
   Migration nuova → numero successivo libero in `supabase/`, **mai eseguita**: nel corpo
   della PR scrivi "Prima del merge esegui `supabase/NNN_...sql` nell'SQL editor".
5. Tutto verde:
   `npm run lint && npx tsc --noEmit && npm test && npm run check:fb-aree && npm run build`.
6. Push e PR (base `main`). Corpo:
   ```
   <cosa cambia e perché, 2-5 righe>

   Closes #<N>
   Nota per Lorenzo: <una frase senza gergo su cosa è cambiato e dove guardare>
   ```
   Repo **pubblico**: niente dati personali. Controlla il corpo con
   `node .github/scripts/privacy.mjs <file>`.
7. Torna a `main` pulito prima della issue successiva. Una PR per issue.

Mai merge, mai approvare, mai push su `main`.
