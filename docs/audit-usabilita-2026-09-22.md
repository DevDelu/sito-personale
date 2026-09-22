# Audit usabilità/leggibilità — 22/09/2026

Fase 1 del prompt "Usabilità e leggibilità di tutto il sito" (Parte B). Ambito effettivamente
coperto in questo giro: **solo il portfolio pubblico** (`app/[locale]/*`, `components/home/*`,
`components/progetti/*`). Il privato desktop non è incluso qui — vedi "Limiti di questo audit"
sotto per il motivo e cosa serve per completarlo.

## Limiti di questo audit (da sapere prima di leggere i risultati)

- **Nessuna credenziale per l'area privata**: non ho un modo di autenticarmi come Lorenzo in
  questo ambiente, quindi non ho potuto fare screenshot né controlli su Spese/Investimenti/Carte
  (Fase 1 del prompt originale li includeva). Fase 4 (fix privato desktop) resta bloccata su
  questo finché non viene fornito un modo di login (account di test o `storageState.json`).
- **Skill esterne non installate**: non ho installato frontend-design, Impeccable,
  web-design-guidelines né la suite Nielsen/WCAG di `mastepanoski/claude-skills` (richiedono
  plugin marketplace/npx a livello utente, fuori scope rapido per questo giro). L'audit sotto è
  una revisione manuale del codice + verifica di contrasto calcolata a mano (formula WCAG
  standard) + screenshot Playwright, non l'output di quegli strumenti. Se vuoi che li installi
  comunque prima di procedere ai fix, dimmelo.
- **Screenshot homepage falliti**: la home (`/`) richiede Supabase configurato (la sezione quiz
  fa una query diretta), e questo ambiente non ha un `.env.local` con credenziali Supabase reali
  — lo screenshot della home è quindi una pagina di errore Next.js, inutilizzabile. Le pagine
  `/progetti` (lista) e una case study (`/progetti/radar`) non dipendono da Supabase e sono state
  catturate correttamente a 1440×900 e 390×844, chiaro/scuro.
- **`prompt-ui-mobile-app-feel.md`**: confermato non partito (nessun branch/PR relativo). Questo
  audit quindi copre solo pubblico, non entra in conflitto con quel piano.

## Riepilogo per severità

| Severità | # | Dove |
|---|---|---|
| Bloccante | 2 | Landmark `<main>`, contrasto colori accento case study |
| Da correggere | 3 | Salto h1→h3 in `/progetti`, link "Vedi tutti" fuori contesto, link esterni senza indicazione "nuova scheda" |
| Nice-to-have | 2 | Alt text ridondante su card progetto, nessuna nav persistente tra le sezioni |

---

## Pubblico desktop + mobile (gli stessi problemi valgono a entrambi i breakpoint, il codice non è responsive-specific)

### 🔴 Bloccante — La maggior parte della homepage è fuori dal landmark `<main>`

`components/home/Hero.tsx` (riga 26) racchiude solo il proprio contenuto in un tag `<main>`.
`app/[locale]/page.tsx` however renders `<Hero/><About/><QuizSection/><Skills/><FeaturedProjects/><Contact/>`
come fratelli: `About`, `QuizSection`, `Skills`, `FeaturedProjects` e `Contact` (cioè quasi tutto
il contenuto della pagina) finiscono **fuori** dal landmark `<main>`, come fratelli successivi a
`</main>` nel DOM. Per uno screen reader che salta ai landmark ("vai al contenuto principale"),
solo l'Hero è raggiungibile così: tutto il resto (chi sono, competenze, progetti, contatti) è
percepito come contenuto "fuori pagina".

**Fix minimo suggerito** (Fase 3, non ora): spostare `<main>` a livello di `page.tsx` (o del
layout) intorno a tutti i figli, e togliere il `<main>` interno da `Hero.tsx` sostituendolo con
`<div>`.

### 🔴 Bloccante — Colori accento delle case study non passano il contrasto AA in tema chiaro

`components/progetti/case-study-layout.tsx` usa `accent.primary/secondary/tertiary` (definiti
per progetto in `content/projects/*.mdx`, frontmatter `accentColors`, fallback
`DEFAULT_ACCENT` in `lib/progetti-theme.ts`) come **colore del testo diretto** — via
`style={{ color: ... }}` — su tre punti: l'etichetta categoria/anno, i numeri delle statistiche
(`stat-number`, testo grande) e il testo/bordo dei link esterni in fondo pagina. Questi colori
sono arbitrari per progetto e **non validati contro lo sfondo del tema**.

Calcolo contrasto (formula WCAG standard, sfondo chiaro `--background: #f3f0e7`) sui valori
attualmente in `content/projects/radar.mdx` e nel fallback `DEFAULT_ACCENT` (usato da
`piattaforma-aperitivi.mdx`, che non definisce `accentColors`):

| Colore | Uso | Contrasto su sfondo chiaro | Soglia richiesta | Esito |
|---|---|---|---|---|
| `#c25a1e` (primary / DEFAULT_ACCENT) | etichetta categoria (testo piccolo), link esterni (testo piccolo) | 3.86:1 | 4.5:1 (testo normale) | **Fallisce** |
| `#d9822b` (secondary, radar) | numero statistica (testo grande) | 2.57:1 | 3:1 (testo grande) | **Fallisce** |
| `#e0a458` (tertiary, radar) | numero statistica (testo grande) | 1.92:1 | 3:1 (testo grande) | **Fallisce, visibilmente quasi illeggibile** — confermato nello screenshot `case-study-radar-desktop-light.png`, il terzo numero statistica ("2") è nettamente più tenue degli altri due |

In tema scuro (`--background: #0c1210`) gli stessi colori passano ampiamente (contrasto 4.3–8.7),
quindi il problema è specifico al tema chiaro.

**Non è un problema del design system globale** (i token `--accent`/`--stamp`/`--muted` del sito
pubblico passano tutti AA, verificato — vedi tabella sotto): è specifico ai colori per-progetto
nel frontmatter MDX, che nessuna verifica automatica controlla oggi.

**Fix minimo suggerito** (da concordare, non implementato ora): o abbassare la luminosità/HSL dei
colori "secondary"/"tertiary" in `content/projects/radar.mdx` così da passare almeno la soglia
"testo grande" (3:1) in entrambi i temi, o smettere di usarli come colore testo diretto per i
numeri (es. solo come accento decorativo/bordo, testo in `--foreground`).

### Contrasto — coppie del design system verificate (tutte passano)

Calcolate sui token base (`app/globals.css`, `:root` e `.dark`) e su `.site-public`/
`[data-theme="dark"] .site-public`:

| Coppia | Chiaro | Scuro |
|---|---|---|
| foreground / background | 16.1:1 | 16.3:1 |
| muted / background (testo secondario) | 5.1:1 | 6.6:1 |
| accent / background | 8.4:1 | 4.8:1 |
| stamp / background (errori form) | 4.8:1 | 6.1:1 |
| accent-foreground / accent (testo su bottone pieno) | 8.4:1 | 4.8:1 |

Tutte ≥ 4.5:1 (soglia testo normale AA). Nessun fix necessario qui.

### 🟡 Da correggere — Salto di livello h1 → h3 in `/progetti`

`app/[locale]/progetti/page.tsx` ha un `<h1>` ("Progetti"/"Projects") seguito direttamente dalle
card progetto, i cui titoli sono `<h3>` (`components/progetti/project-card.tsx` riga 34) — non
c'è nessun `<h2>` intermedio. Sulla home lo stesso `<h3>` è corretto perché sotto un `<h2>`
("Progetti in evidenza", da `SectionHeading`), ma nella lista dedicata manca quel livello.
Non blocca la navigazione ma rompe la struttura semantica per chi naviga per intestazioni
(screen reader, outline).

**Fix minimo suggerito**: sulla pagina lista, o alzare i titoli delle card a `h2` (solo lì, via
prop), o introdurre un `h2` visivamente nascosto ("Elenco progetti") prima della griglia.

### 🟡 Da correggere — Link "Vedi tutti" isolato dal contesto

`components/home/FeaturedProjects.tsx` riga 28: il link verso `/progetti` ha solo il testo
"Vedi tutti"/"View all" (+ icona freccia `aria-hidden`). Chi naviga per link isolati (screen
reader, elenco link) non ha modo di sapere "tutti cosa" senza il contesto visivo della sezione.

**Fix minimo suggerito**: `aria-label` più descrittivo sul link (es. "Vedi tutti i progetti"),
senza cambiare il testo visibile.

### 🟡 Da correggere — Link esterni senza indicazione "si apre in una nuova scheda"

Tre punti aprono `target="_blank"` senza segnalarlo a chi non vede il cambio di scheda: il
pulsante LinkedIn in `Hero.tsx` (riga 35) e i link di progetto in `CaseStudyLayout` (riga 96).
Buona pratica WCAG (non bloccante AA, ma citata nelle linee guida), specialmente perché il CV
(`DownloadCvButton`) scarica invece di aprire scheda — comportamento incoerente tra i tre
pulsanti hero senza che l'utente possa distinguerli in anticipo.

**Fix minimo suggerito**: testo visivamente nascosto ("si apre in una nuova scheda") o icona con
`aria-label` sui link `target="_blank"`.

### 🟢 Nice-to-have — Alt text ridondante sulle card progetto

`ProjectCard` (riga 17) usa `project.title` come `alt` dell'immagine copertina, che è anche il
testo dell'`<h3>` subito sotto nella stessa card-link. Per screen reader è una ripetizione (link
già annuncia titolo due volte). Non è sbagliato, solo ridondante — potrebbe diventare `alt=""`
dato che l'immagine è puramente decorativa in quel contesto (il titolo testuale porta già
l'informazione).

### 🟢 Nice-to-have — Nessuna navigazione persistente tra le sezioni

`PublicHeader` (solo tema + lingua, nessun link di navigazione) e le sezioni home sono
raggiungibili solo scrollando o dai bottoni hero (che linkano solo a `#contatti`). Su
`/progetti` e nelle case study l'unico modo di tornare è il link "← Home"/"← indietro" in cima
alla pagina. Funziona, ma è un attrito in più per chi arriva già su `/progetti` da link esterno e
vuole "chi sono" o "competenze" senza tornare alla home e scrollare. Non blocca nulla, solo da
tenere in mente se emergono altri problemi di navigazione nella Fase 3.

---

## Privato desktop / mobile

Non auditato in questo giro — vedi "Limiti di questo audit" sopra. Serve un modo di autenticarsi
per procedere (account di test dedicato, o un `storageState.json` di sessione Supabase già
autenticata, esportato da un login manuale fatto da te).

---

## Prossimi passi

Come da Fase 2 del prompt: **mi fermo qui**, senza toccare codice. In attesa delle tue priorità
su cosa correggere per primo tra i punti sopra (o conferma di procedere con tutti i "bloccanti" +
"da correggere" del pubblico), e di un modo per accedere all'area privata per completare l'audit
di quella parte.
