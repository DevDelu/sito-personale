import type { Evento } from "./types";

// Testo della notifica push del mattino: quanti eventi ci sono oggi, titolo e
// ora del primo, cenno alla nota del giorno. Puro (fuso Europe/Rome passato
// dal chiamante come `oggi`), così si testa con node:test.

const FUSO = "Europe/Rome";

function dataRoma(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function oraRoma(iso: string): string {
  return new Intl.DateTimeFormat("it-IT", { timeZone: FUSO, hour: "2-digit", minute: "2-digit", hour12: false }).format(
    new Date(iso)
  );
}

// Stessa regola di prossimi.ts: gli eventi "tutto il giorno" hanno data_fine
// inclusiva; quelli con orario si leggono nel fuso di Roma.
export function eventiDiOggi(eventi: Evento[], oggi: string): Evento[] {
  return eventi
    .filter((e) => {
      const inizio = e.tutto_il_giorno ? e.data_inizio.slice(0, 10) : dataRoma(e.data_inizio);
      const fine = e.tutto_il_giorno ? e.data_fine.slice(0, 10) : dataRoma(e.data_fine);
      return inizio <= oggi && fine >= oggi;
    })
    .sort((a, b) =>
      a.tutto_il_giorno !== b.tutto_il_giorno
        ? a.tutto_il_giorno
          ? -1
          : 1
        : a.data_inizio.localeCompare(b.data_inizio)
    );
}

export function componiPushAgenda(
  eventi: Evento[],
  oggi: string,
  haNota: boolean
): { title: string; body: string } | null {
  const doggi = eventiDiOggi(eventi, oggi);
  if (doggi.length === 0 && !haNota) return null;

  const nota = haNota ? " C'è anche la nota del giorno." : "";
  if (doggi.length === 0) return { title: "Agenda di oggi", body: `Nessun evento, ma hai una nota per oggi.` };

  const primo = doggi[0];
  const quando = primo.tutto_il_giorno ? "tutto il giorno" : `alle ${oraRoma(primo.data_inizio)}`;
  const conteggio = doggi.length === 1 ? "Oggi hai 1 evento" : `Oggi hai ${doggi.length} eventi`;
  const dettaglio = doggi.length === 1 ? `${primo.titolo}, ${quando}.` : `Il primo: ${primo.titolo}, ${quando}.`;
  return { title: "Agenda di oggi", body: `${conteggio}. ${dettaglio}${nota}` };
}
