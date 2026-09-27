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
- [ ] Vercel → Settings → Deployment Protection: se "Vercel Authentication" è attiva sulle
  anteprime, creare "Protection Bypass for Automation" e salvarlo come secret `VERCEL_BYPASS_SECRET`.
- [ ] Dopo aver sistemato i secret: Actions → collaudo → Run workflow, deve diventare verde.

## Già attivo

- Feedback dall'app (pressione lunga sulla tab, pulsante in Spese, `/altro`, tasto F).
- Job notturno feedback → issue `dal-lorenzo` (`radar-feedback-notte.yml`).
- Utente tester in sola lettura + controllo owner centrale sulle API.
- Collaudatore Playwright (`collaudo.yml`), in attesa dei secret.

## Prossimi pezzi (ritmo scelto: intenso, tutto ogni notte)

1. Tester con Claude: esplora il sito come Lorenzo, issue `dal-tester`.
2. Sviluppatore notturno (una PR `agente` per notte, priorità `dal-lorenzo` → `dal-collaudo` →
   `dal-tester`) e Revisore sulle PR `agente`.
3. Diario condiviso degli agenti (`.claude/diario-agenti.md`) + lezione dalle PR chiuse senza merge.
4. Product domenicale (retrospettiva, una proposta, docs, salute tecnica) + Dependabot.

Vincoli: costo zero (abbonamento Claude già pagato, Actions gratis sul repo pubblico), niente
auto-merge, mai dati personali in issue/log/artifact.
