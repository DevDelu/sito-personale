# Lezioni degli agenti

Cosa non ha funzionato e cosa fare diversamente: PR chiuse senza merge, feedback riaperti più
volte, scelte che Lorenzo ha corretto. Lo legge il giro notturno all'inizio di ogni notte e lo
aggiorna il documentarista la domenica. Mai testi di Lorenzo né dati personali (repo pubblico).

## Lezioni

- Le variabili mancanti nell'ambiente cloud non devono fermare tutta la notte: si salta solo
  la fase che le richiede e lo si dice in cima al resoconto (dal 30/09 al 24/10 lo sviluppatore
  si è fermato ogni notte dopo pochi secondi senza che nessuno se ne accorgesse).
- Le variabili segrete non si configurano nell'ambiente cloud: le routine girano nel progetto e le
  ricevono dal blocco `VARIABILI` del loro prompt. Il `fetch` di Node ignora il proxy di rete della
  sessione se manca `NODE_USE_ENV_PROXY=1`: gli script (`scripts/feedback.mjs`, newsletter,
  screenshot) fallivano per questo, non per i dati.
- Una pagina fuori da `app/[locale]/` che non è in `UNLOCALIZED_*` di `proxy.ts` dà 404 (il recupero
  password è rimasto rotto così). Quando aggiungi una rotta, controlla subito `proxy.ts` e scrivi un
  test e2e da visitatore che la apre davvero.
- Un secret rigenerato o ricreato non vale finché non c'è un nuovo deploy Vercel: tre PR `docs:`
  consecutive (promemoria, rigenerazione, ricreazione) sono nate dal non verificarlo. Prima di
  toccare un secret, controlla in quali posti vive (Vercel, GitHub, prompt delle routine) e aggiorna
  tutti insieme.
- Tester e newsletter richiedono le variabili: prima limitati al turno principale, poi estesi a
  tutti i turni dove le variabili ci sono. Non assumere dove girano: leggi lo stato delle variabili
  a inizio turno e salta solo la fase che manca.
- Skill di terze parti: leggerle per intero e adattarle prima di copiarle (le due scartate usavano
  token Vercel o Python senza bisogno). Mai installarle in automatico dal web.
- Costo zero: nessuna soluzione può richiedere chiavi API o piani a pagamento; se serve, è una
  proposta nel resoconto, non un'azione.
- Metadata Next.js: l'immagine `opengraph-image` della convenzione non è ereditata dalle pagine annidate che
  definiscono il proprio `openGraph` (la home sì). Dopo un cambio ai metadata controlla `og:image` anche su
  `/progetti/<slug>` in produzione (25/10: #115 aveva tolto l'immagine ai progetti, corretto da #116).
- Un file di convenzione in root (`sitemap.xml`, `robots.txt`) passa dal matcher di `proxy.ts`: senza
  esclusione next-intl lo rende 404 (vedi #113).
- La newsletter non partiva per due motivi, non per mancanza di novità: il tag `newsletter/ultima` non
  è mai stato creato e Resend risponde 403 perché il dominio `lorenzo-de-luca.com` non è verificato
  su resend.com/domains. Con il 403 l'invio fallisce comunque: il resoconto passa da Gmail.
- Nelle worktree degli agenti: mai `git add -A` dal checkout principale con `.claude/worktrees` presente
  (finiscono come repository incorporati nel commit); rimuovi le worktree prima del commit.
- Nessuna PR chiusa senza merge né feedback `ostinato` negli ultimi 7 giorni: nulla da imparare da lì.
- Password con caratteri speciali (`!`): nel file delle variabili vanno tra virgolette singole e il JSON
  del login si costruisce con `JSON.stringify` in node, mai a mano nella shell. Il rifiuto "Invalid login
  credentials" del 26/10 (#133) non era una password sbagliata: con le variabili del prompt il login dà 200.
- Collaudo rosso solo sulle anteprime Vercel (26/10, dalle 09:54): il login del tester riusciva (i test
  partivano, la produzione passava a mano con `workflow_dispatch`) ma le pagine private finivano su un
  percorso `/login`. Causa vera: il secret GitHub era stato salvato con il nome sbagliato
  (`VERCEL_BYPASSS_SECRET`, tre S), quindi il workflow leggeva `VERCEL_BYPASS_SECRET` vuoto e Vercel
  mandava il test al suo login (le anteprime sono protette). Non erano i secret del tester né il codice.
  Un secret GitHub non si rinomina: si crea quello giusto e si cancella l'altro. Da allora il collaudo
  si ferma subito con un messaggio che dice il motivo (`tests/e2e/diagnosi-accesso.ts`), e nel log
  Actions la riga `VERCEL_BYPASS_SECRET:` vuota è il segnale. Le variabili di Vercel valgono solo per i
  deploy nuovi: per verificare serve un'anteprima fresca, non il rilancio di una vecchia.
- Nella sandbox `gh pr create` fallisce (GraphQL): usare gli strumenti GitHub MCP o `gh api repos/.../pulls`.
  `npm run dev` richiede `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` fittizie, e il build
  locale non raggiunge Google Fonts: la verifica del build è la CI.
- Un agente che pusha da una worktree con un branch già esistente può includere commit altrui (successo
  con `audit/home-ux`): partire sempre da `origin/main` con `git checkout -B <nuovo> origin/main`.
- `git fetch origin` prima di ogni `git checkout -B <branch> origin/main`: il 26/10 (sera) un branch creato da un
  `origin/main` locale vecchio non aveva le PR appena mergiate, e il collaudo (che esegue i test dell'unione con
  `main` contro l'anteprima del solo branch) è andato rosso con 18 test falliti (#159). Si sistema con un merge di
  `origin/main` nel branch, non con un workaround nei test.
- Prima del merge di una PR guarda che anche `collaudo` (non solo `controlli`) sia concluso: il 26/10 #154 è stata
  mergiata con `collaudo` ancora in corso (è poi risultato verde, ma la regola resta).
- Worktree degli agenti: `node_modules` come symlink fa fallire Turbopack (`next build`); per un build in worktree
  serve `npm ci` dentro la worktree. Il build locale non raggiunge Google Fonts: la verifica è la CI.
- Log del collaudo: `gh api .../actions/jobs/<id>/logs` è bloccato dal proxy; usa lo strumento GitHub MCP
  `get_job_logs` con `run_id`, `failed_only` e `return_content`.
- `ModalDialog` → `Sheet` non è solo estetica: lo Sheet non trattiene il focus, non lo restituisce e chiude su tocco dello sfondo / Esc su `window` (il vecchio modale no, vedi #150). Per i form usa `chiudiSuSfondo={false}` e segnala il compromesso nella PR; prima di convertire molti modali conviene portare il focus trap dentro `Sheet` (PR #185, #195 aperte per questo).
- Il collaudo di una PR può metterci da 2 a 11 minuti (27/10, #194): non è bloccato finché lo stato è `in_progress`; controlla con `gh api repos/.../actions/runs/<id> --jq .status` invece di rileggere tutto.
- `list_workflow_runs` (MCP GitHub) restituisce decine di KB: usa `gh api ... --jq` con i soli campi che servono.
- Cambio lingua: con `localePrefix: as-needed` il `Link` di next-intl verso l'italiano produce `href="/it"`, che il proxy reindirizza (307) a `/`: funziona, ma c'è un redirect in più. Se lo si vuole evitare, passare `href` già senza prefisso.
- `<html lang>` fisso nel layout radice: `HtmlLangSync` lo allinea solo dopo l'idratazione; per il fix pieno servirebbe spostare `<html>` in `app/[locale]/layout.tsx` (#192 resta aperta).
