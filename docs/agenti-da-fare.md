# Team di agenti Radar: cosa manca

Promemoria dei passi manuali ancora aperti e dei prossimi pezzi da costruire. Aggiornalo quando
un punto è fatto.

## Passi manuali di Lorenzo (aperti)

- [ ] **Secret GitHub del tester**: in Settings → Secrets and variables → Actions, scheda
  **Secrets** (non Variables, non Environments), sotto "Repository secrets" devono esserci:
  `TESTER_EMAIL`, `TESTER_PASSWORD`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`. Il 27/09 il collaudo li
  riceveva vuoti (mentre `RADAR_URL` c'era). Finché mancano, `collaudo.yml` si salta con un avviso.
- [ ] Verificare che ci siano anche `CLAUDE_CODE_OAUTH_TOKEN` e `FEEDBACK_AGENTE_SECRET` (servono
  al job notturno feedback → issue).
- [ ] Eseguire `supabase/033_feedback_ciclo.sql` nell'SQL editor (dopo 031 e 032).
- [ ] `FEEDBACK_AGENTE_SECRET` (o l'alias `FEEDBACK_AGENT_SECRET`, stesso valore) su Vercel **e**
  nei secret GitHub: ora lo usano anche `feedback-pr.yml` e `feedback-deploy.yml`.
- [ ] Al primo deploy di produzione dopo il merge: Actions → feedback-deploy deve partire (evento
  `deployment_status`, ambiente Production) e non essere "skipped".
- [ ] Vercel → Settings → Deployment Protection: se "Vercel Authentication" è attiva sulle
  anteprime, creare "Protection Bypass for Automation" e salvarlo come secret `VERCEL_BYPASS_SECRET`.
- [ ] Dopo aver sistemato i secret: Actions → collaudo → Run workflow, deve diventare verde.

## Già attivo

- Feedback dall'app (pressione lunga sulla tab, pulsante in Spese, `/altro`, tasto F).
- Job notturno feedback → issue `dal-lorenzo` (`radar-feedback-notte.yml`), con riaperture e note.
- Ciclo chiuso dei feedback: stati, pagina `/feedback`, avviso di verifica, `feedback-pr.yml` e
  `feedback-deploy.yml`.
- Utente tester in sola lettura + controllo owner centrale sulle API.
- Collaudatore Playwright (`collaudo.yml`), in attesa dei secret.

## Convenzioni per chi sistema i feedback (sviluppatore notturno, anche futuro)

- **Priorità**: issue `riaperto` (Lorenzo ha verificato in produzione: non è sistemato) → `ready`
  → `dal-lorenzo` → il resto invariato (`dal-collaudo`, `dal-tester`).
- **`ostinato`** (riaperto 2+ volte): non ritentare alla cieca. Chiedi a Lorenzo con
  `POST /api/feedback/agente { issue_number, stato: "serve-info", testo: "<una domanda concreta>" }`
  oppure proponi un approccio diverso nella issue.
- **Riprodurre**: la issue ha route, area, ruolo/etichetta dell'elemento e tipo di entità; il
  tester in sola lettura legge `url`, `punto.selettore` ed `entita` completi dal DB. Se non si
  riproduce: `serve-info` con **una sola** domanda concreta (niente dati personali nella domanda:
  la vede solo Lorenzo, ma resta buona norma).
- **Ogni PR che chiude un feedback** (`Closes #N` su una issue `dal-lorenzo`) ha nel corpo una riga
  `Nota per Lorenzo: <una frase, senza gergo, su cosa è cambiato>`: diventa la `nota-fix` che
  Lorenzo legge nell'avviso di verifica. Quando esisterà il POTENZIAMENTO 2, la PR include anche un
  test e2e sul punto segnalato.
- **Mai** impostare `verificato` o `scartato` (403): li decide solo Lorenzo. `da-verificare` lo
  imposta `feedback-deploy.yml` dopo il deploy di produzione, non il merge.

## Non ancora costruito (dal prompt "Feedback: ciclo chiuso", 28/09)

- **Email mattutina**: non esiste ancora. Quando ci sarà, in cima nell'ordine: serve una tua
  risposta → da verificare (in particolare > 7 giorni in `da-verificare`) → riaperti/ostinati →
  nuovi presi in carico. I dati ci sono già (`feedback.stato`, `updated_at`, `riaperture`).
- **`/officina`**: non esiste; il riepilogo (contatori, tempo medio fino a verificato, tasso di
  riapertura) vive per ora in fondo a `/feedback`.
- **`radar-daily.yml` / `pr-review.yml`**: non esistono; le convenzioni sopra sono pronte per lo
  sviluppatore notturno.

## Prossimi pezzi (ritmo scelto: intenso, tutto ogni notte)

1. Tester con Claude: esplora il sito come Lorenzo, issue `dal-tester`.
2. Sviluppatore notturno (una PR `agente` per notte, priorità `dal-lorenzo` → `dal-collaudo` →
   `dal-tester`) e Revisore sulle PR `agente`.
3. Diario condiviso degli agenti (`.claude/diario-agenti.md`) + lezione dalle PR chiuse senza merge.
4. Product domenicale (retrospettiva, una proposta, docs, salute tecnica) + Dependabot.

Vincoli: costo zero (abbonamento Claude già pagato, Actions gratis sul repo pubblico), niente
auto-merge, mai dati personali in issue/log/artifact.
