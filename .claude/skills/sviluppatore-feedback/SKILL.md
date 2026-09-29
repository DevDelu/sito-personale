---
name: sviluppatore-feedback
description: Lavora i feedback che Lorenzo ha lasciato dal sito (testo originale da Supabase) e apre una PR per ciascuno, pronta da approvare. Usala quando Lorenzo chiede di sistemare/lavorare i suoi feedback o le issue dal-lorenzo, quando chiede "cosa ho scritto nei feedback", e nel giro notturno della routine.
---

# Sviluppatore dei feedback di Lorenzo

Lorenzo, durante la giornata, detta i feedback dal sito (problemi, cose
complicate, idee). Tu li leggi **parola per parola** da Supabase, li sistemi
uno per uno e per ciascuno apri una PR che lui approva (merge) e poi verifica
sul sito. Non dargli mai risposte vaghe: se qualcosa non è chiaro gli fai
**una** domanda precisa, se qualcosa ti blocca glielo dici col motivo esatto.

Percorso di ogni feedback (lo vede in `/feedback`, logica in
`lib/feedback/fasi.ts`):

```
Ricevuto (nuovo) → In coda (preso-in-carico) → Da approvare (PR aperta)
  → Da verificare (dopo merge + deploy) → Verificato | Non risolto → riaperto
```

## 0. Prerequisiti (fermati se mancano)

```bash
node scripts/feedback.mjs elenco aperti
```

Se dice che mancano `RADAR_URL` / `FEEDBACK_AGENTE_SECRET`: **fermati** e
scrivi a Lorenzo che vanno aggiunte come variabili dell'ambiente cloud di
Claude Code (menu dell'ambiente → Edit), stessi valori dei secret GitHub
omonimi. Non ripiegare sulle issue GitHub: lì il testo non c'è.

Se Lorenzo ti chiede solo di **leggere** i feedback, fermati qui: mostragli
l'elenco con il testo integrale (e `mostra <id>` per note e storia).

## 1. Coda di lavoro

Dall'elenco degli aperti, in quest'ordine (il più vecchio prima dentro ogni
gruppo):

1. `riaperto`, o `preso-in-carico` con `riaperture > 0` (il job notturno
   delle issue li rimette in coda): Lorenzo ha verificato e **non** è
   sistemato. Leggi la sua
   nota "non risolto" nella storia. Se `riaperture >= 2` non ritentare la
   stessa strada: cambia approccio o fai una domanda.
2. `preso-in-carico` (anche quelli tornati qui dopo una risposta di Lorenzo
   a una tua domanda: la risposta è nella storia).
3. `nuovo`: portalo prima a `preso-in-carico`:
   `node scripts/feedback.mjs stato <id> preso-in-carico`.

Salta: `serve-info` (aspetta Lorenzo), `in-lavorazione` (ha già una PR
aperta), `da-verificare`.

Se Lorenzo ti ha indicato feedback precisi, lavora solo quelli.

## 2. Per ogni feedback

1. `node scripts/feedback.mjs mostra <id>`: testo, **tutta la storia**
   (note, risposte, "non risolto"), `url` reale, `area`, `punto.selettore`,
   `entita`, contesto (viewport, tema, attriti).
2. Trova il codice: `route` → `app/(private)/<...>`; `grep -rn
   'data-fb-area="<area>"'` porta al componente esatto; `punto.selettore` e
   `punto.etichetta` all'elemento. Leggi `CLAUDE.md` e segui le sue regole
   (primitive mobile, `requireWriter()`, query in `lib/<dominio>/queries.ts`,
   aree di feedback su pagine/modali nuovi, ecc.).
3. Decidi:
   - **Chiaro** → sistemalo (sotto).
   - **Ambiguo, o un'idea con più strade possibili** → una sola domanda
     concreta, con le opzioni se ci sono:
     `node scripts/feedback.mjs domanda <id> "Nel grafico di Spese vuoi ... (A) o ... (B)?"`
     e passa al successivo. Lorenzo la vede in `/feedback` → "Per te".
   - **Troppo grande per una notte** → domanda con la tua proposta in 2-3
     frasi e chiedi se procedere.
4. Sistemalo su un branch per feedback, da `main` aggiornato:
   ```bash
   git fetch origin main && git checkout -B feedback/<primi-8-caratteri-id>-<slug> origin/main
   ```
   Modifica minima e coerente col codice intorno. Bug corretto → test che
   fallisce prima e passa dopo (unit in `lib/**/*.test.ts`, o e2e in
   `tests/e2e/` se è comportamento di pagina). Poi, tutti verdi:
   ```bash
   npm run lint && npx tsc --noEmit && npm test && npm run check:fb-aree && npm run build
   ```
   UI mobile: controlla a 390px e 375px (vedi CLAUDE.md > UI mobile).
5. Commit, `git push -u origin <branch>`, poi apri la PR (GitHub MCP
   `create_pull_request`, base `main`). **Il repo è pubblico**: titolo e
   corpo non contengono mai il testo di Lorenzo né dati (importi, valute,
   date, nomi, email, numeri). Descrivi il cambiamento del codice. Prima di
   aprirla, scrivi titolo+corpo in un file nella scratchpad e controlla:
   ```bash
   node .github/scripts/privacy.mjs <file-pr> <file-con-testo-originale>
   ```
   Corpo della PR, con queste righe esatte (le leggono i workflow):
   ```
   <cosa cambia e perché, 2-5 righe, senza dati personali>

   Closes #<issue_number>          ← solo se il feedback ha una issue
   Feedback-id: <uuid del feedback>
   Nota per Lorenzo: <una frase senza gergo su cosa è cambiato e dove guardare>
   ```
   `feedback-pr.yml` porta il feedback a "Da approvare" (in-lavorazione con
   PR); al merge salva la "Nota per Lorenzo"; dopo il deploy di produzione
   `feedback-deploy.yml` lo passa a "Da verificare".
6. Torna a `main` pulito prima del feedback successivo. Una PR per
   feedback: Lorenzo approva o rifiuta ognuna da sola. Se due feedback
   toccano esattamente la stessa cosa, una PR con due righe `Feedback-id`.

## 3. Regole

- **Mai** fare merge, approvare PR, né impostare `verificato`, `scartato`,
  `da-verificare` o `riaperto`: li decide Lorenzo o il sistema.
- Mai stampare testi dei feedback in posti pubblici: issue, PR, commit,
  commenti GitHub, log di Actions. Il resoconto della sessione (privata) sì.
- Una PR rossa in CI è lavoro tuo: sistemala prima di passare oltre.
- Se non riesci a sistemare un feedback, non lasciarlo in silenzio: fai la
  domanda (`serve-info`) spiegando cosa hai provato.

## 4. Resoconto finale (nella sessione)

Per ogni feedback lavorato: il testo di Lorenzo (breve), cosa hai fatto,
link alla PR, oppure la domanda che gli hai fatto. In fondo: quanti ne
restano e perché (es. "2 aspettano una tua risposta"). Niente frasi vaghe.
