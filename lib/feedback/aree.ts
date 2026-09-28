// Aree nominate dell'area privata: id usato nell'attributo
// `data-fb-area="modulo.pagina.sezione"` → etichetta leggibile in italiano.
// È l'UNICO posto dove vivono le etichette (sheet di feedback, pagina
// /feedback, issue su GitHub). `npm run check:fb-aree` fallisce se una
// pagina privata non ha almeno un'area o se un'area usata nel codice non è
// qui. Nessun import: letto anche dallo script di controllo e dai test.
//
// Convenzione: sezioni principali delle pagine con un wrapper
// `<div data-fb-area="..." className="contents">` (nessun effetto sul
// layout), sheet e modali con `area` su <Sheet> o `data-fb-area` sul
// `.modal-panel`. Sugli elementi che rappresentano un dato:
// `data-fb-entita="tipo:id"` (solo tipo e id, nient'altro).
export const AREE_FEEDBACK = {
  // Spese
  "spese.overview.filtri": "Spese › Overview › Periodo",
  "spese.overview.riepilogo": "Spese › Overview › Entrate e uscite",
  "spese.overview.trend": "Spese › Overview › Andamento giornaliero",
  "spese.overview.categorie-trend": "Spese › Overview › Andamento per categoria",
  "spese.overview.torta": "Spese › Overview › Movimenti per categoria",
  "spese.gestione.filtri": "Spese › Gestione › Filtri",
  "spese.gestione.tabella": "Spese › Gestione › Tabella movimenti",
  "spese.gestione.paginazione": "Spese › Gestione › Paginazione",
  "spese.importa.form": "Spese › Importa › Caricamento file",
  "spese.nuovo.form": "Spese › Nuovo movimento",
  "spese.modifica-movimento": "Spese › Modifica movimento",
  "spese.dettaglio-movimento": "Spese › Dettaglio movimento",
  "spese.modifica-multipla": "Spese › Modifica in blocco",
  "spese.filtri-gestione": "Spese › Gestione › Filtri (pannello)",
  "spese.periodo-personalizzato": "Spese › Overview › Periodo personalizzato",
  "spese.scegli-categoria": "Spese › Scegli categoria",
  "spese.dettaglio-giorno": "Spese › Dettaglio giorno",

  // Investimenti
  "investimenti.overview.aggiorna-prezzi": "Investimenti › Overview › Aggiornamento prezzi",
  "investimenti.overview.riepilogo": "Investimenti › Overview › Riepilogo",
  "investimenti.overview.grafici": "Investimenti › Overview › Grafici",
  "investimenti.posizioni": "Investimenti › Overview › Posizioni",
  "investimenti.gestione.riconciliazione": "Investimenti › Gestione › Riconciliazione",
  "investimenti.gestione.tabella": "Investimenti › Gestione › Tabella transazioni",
  "investimenti.importa.form": "Investimenti › Importa › Caricamento file",
  "investimenti.transazione-form": "Investimenti › Transazione (modifica)",
  "investimenti.modifica-costo-multipla": "Investimenti › Qualità del costo in blocco",

  // Carte
  "collezione.metriche": "Carte › Valore e numero carte",
  "collezione.griglia": "Carte › Collezione",
  "collezione.nuova.form": "Carte › Aggiungi carta",
  "collezione.dettaglio-carta": "Carte › Dettaglio carta",
  "collezione.modifica-carta": "Carte › Modifica carta",

  // Allenamenti
  "allenamenti.overview.metriche": "Allenamento › Overview › Riepilogo",
  "allenamenti.overview.schede": "Allenamento › Overview › Avvia allenamento",
  "allenamenti.schede.lista": "Allenamento › Le mie schede",
  "allenamenti.scheda.editor": "Allenamento › Modifica scheda",
  "allenamenti.sessione.runner": "Allenamento › Sessione in corso",
  "allenamenti.storico.sessioni": "Allenamento › Storico › Sessioni",
  "allenamenti.storico.progressi": "Allenamento › Storico › Progressi",
  "allenamenti.storico.dettaglio": "Allenamento › Storico › Dettaglio sessione",
  "allenamenti.nuova-scheda": "Allenamento › Nuova scheda",
  "allenamenti.rinomina-blocco": "Allenamento › Rinomina blocco",
  "allenamenti.esercizio-scheda": "Allenamento › Esercizio della scheda",
  "allenamenti.impegno-fisso": "Allenamento › Nuovo impegno fisso",
  "allenamenti.modifica-sessioni-multipla": "Allenamento › Modifica sessioni in blocco",
  "allenamenti.sessione.conferma": "Allenamento › Sessione › Conferma",

  // Agenda
  "agenda.board": "Agenda › Calendario e giorno",
  "agenda.nota": "Agenda › Nota",
  "agenda.evento-form": "Agenda › Evento",

  // Alimentazione
  "alimentazione.overview.tdee": "Alimentazione › Overview › TDEE",
  "alimentazione.overview.macro-trend": "Alimentazione › Overview › Macro e trend",
  "alimentazione.overview.aderenza": "Alimentazione › Overview › Aderenza",
  "alimentazione.overview.pasti-oggi": "Alimentazione › Overview › Pasti di oggi",
  "alimentazione.gestione.filtri": "Alimentazione › Gestione › Filtri",
  "alimentazione.gestione.tabella": "Alimentazione › Gestione › Tabella pasti",
  "alimentazione.gestione.paginazione": "Alimentazione › Gestione › Paginazione",
  "alimentazione.aggiungi.form": "Alimentazione › Aggiungi pasto",
  "alimentazione.profilo.dati": "Alimentazione › Profilo › Dati",
  "alimentazione.profilo.peso": "Alimentazione › Profilo › Registra peso",
  "alimentazione.profilo.storico-peso": "Alimentazione › Profilo › Storico peso",
  "alimentazione.template.griglia": "Alimentazione › Template settimanale",
  "alimentazione.modifica-template": "Alimentazione › Modifica template",
  "alimentazione.scanner": "Alimentazione › Scanner codice a barre",
  "alimentazione.modifica-pasto": "Alimentazione › Modifica pasto",

  // Impostazioni, Altro, shell
  "impostazioni.notifiche": "Impostazioni › Notifiche",
  "altro.menu": "Altro",
  "shell.aggiunta-rapida": "Aggiunta rapida",
  "comune.conferma-eliminazione": "Conferma eliminazione",

  // Feedback
  "feedback.riepilogo": "Feedback › Riepilogo",
  "feedback.lista": "Feedback › Elenco",
  "feedback.dettaglio": "Feedback › Dettaglio",
  // Lo sheet di feedback stesso: mai catturato come area di un feedback.
  "feedback.sheet": "Feedback › Scrivi",
} as const;

export type AreaFeedback = keyof typeof AREE_FEEDBACK;

export function isAreaFeedback(v: unknown): v is AreaFeedback {
  return typeof v === "string" && Object.hasOwn(AREE_FEEDBACK, v);
}

export function etichettaArea(area: string | null | undefined): string | null {
  return isAreaFeedback(area) ? AREE_FEEDBACK[area] : null;
}

// Ultimo pezzo dell'etichetta, per il chip "Punto: Tabella movimenti › Modifica".
export function etichettaAreaBreve(area: string | null | undefined): string | null {
  const e = etichettaArea(area);
  return e ? (e.split(" › ").at(-1) ?? e) : null;
}
