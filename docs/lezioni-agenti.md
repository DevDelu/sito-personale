# Lezioni degli agenti

Cosa non ha funzionato e cosa fare diversamente: PR chiuse senza merge, feedback riaperti più
volte, scelte che Lorenzo ha corretto. Lo legge il giro notturno all'inizio di ogni notte e lo
aggiorna il documentarista la domenica. Mai testi di Lorenzo né dati personali (repo pubblico).

## Lezioni

- Le variabili mancanti nell'ambiente cloud non devono fermare tutta la notte: si salta solo
  la fase che le richiede e lo si dice in cima al resoconto (dal 30/09 al 24/10 lo sviluppatore
  si è fermato ogni notte dopo pochi secondi senza che nessuno se ne accorgesse).
- Il blocco `VARIABILI` può contenere caratteri speciali della shell (es. `!` nella password del
  tester): scrivi il file con virgolette singole (`export NOME='valore'`) e costruisci i JSON con
  `JSON.stringify` in Node, mai a mano in una stringa di shell. Il "Invalid login credentials" del
  26/10 (#133) veniva da qui, non da credenziali sbagliate.
