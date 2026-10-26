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
