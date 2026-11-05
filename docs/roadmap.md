# Roadmap

Stato per modulo. Aggiornata dal documentarista la domenica; dettaglio e decisioni in `README.md`,
convenzioni per gli agenti in `CLAUDE.md`, passi manuali aperti in `docs/agenti-da-fare.md`.

## Area pubblica (portfolio)
- Fatto: homepage e `/progetti` bilingue IT/EN, metadata tradotti, hreflang, JSON-LD (24/10).
- In corso: contenuti e case study (content layer in `content/projects`).
- Fatto: animazioni allo scroll solo CSS, easter egg delle sfere del drago.
- Prossimo: contatti e CV scaricabile, elementi interattivi del concept.

## Spese
- Fatto: Overview, Gestione, import Excel con dedup, nuovo movimento, colori categoria, modulo
  modello della UI mobile, promemoria settimanale import (push).
- Prossimo: promemoria condizionale all'ultimo import (backlog).

## Investimenti, Carte, Agenda, Allenamenti
- Fatto: moduli operativi con aggiornamento prezzi (cron + on demand), sync Google Calendar,
  schede e sessioni di allenamento.
- Fatto (24-31/10): passate mobile su Carte (Sheet, podio, errori), Allenamenti (storico, countdown
  configurabile, wake lock), Agenda (pallini nel mese), Investimenti e Spese (tap target 44px).
- Prossimo: ridisegno mobile pagina per pagina, un modulo alla volta, solo se richiesto.

## Alimentazione
- Fatto: Fase A (pasti con snapshot, TDEE, riepilogo), promemoria push pranzo, cena, peso, soglia kcal,
  scanner barcode in Sheet, Gestione a righe su telefono.
- Prossimo: integrazione con allenamento, catalogo esterno: fuori scope per ora.

## UI mobile e PWA
- Fatto: shell iOS, tab bar, push, installazione PWA (schermata di avvio scura), safe-area negli Sheet,
  riduci movimento, modalità discreta, tap target 44px diffusi.
- Prossimo: estendere le primitive (`PageHeader`, `Sheet`...) ai moduli non ancora ridisegnati.

## Feedback (Radar)
- Fatto: sheet, pulsante su ogni pagina, ciclo chiuso, `/feedback`, job notturno verso issue,
  sviluppatore notturno, schede con frase breve e "Cosa è cambiato".
- In corso: fare girare davvero le routine (variabili nei prompt, secret): vedi `docs/agenti-da-fare.md`.
- Prossimo: email mattutina, `/officina`, test e2e sul punto segnalato (POTENZIAMENTO 2).

## Team di agenti
- Fatto: tre turni (principale, qualità, manutenzione), merge a rischio basso con rollback, tester,
  newsletter con screenshot, priorità mobile, regola costo zero, skill esterne.
- In corso: collaudatore in attesa dei secret GitHub del tester.
- Prossimo: diario condiviso degli agenti, Dependabot.

## Sicurezza e manutenzione
- Fatto: controllo owner centrale sulle API, tester in sola lettura, Next.js 16.4.3.
