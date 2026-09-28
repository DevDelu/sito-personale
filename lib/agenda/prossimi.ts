import type { Evento } from "./types";

export type GruppoImpegni = { data: string; etichetta: string; eventi: Evento[] };

// Data locale YYYY-MM-DD (stesso formato di FullCalendar/dateClick).
function dataLocale(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function giornoInizio(e: Evento): string {
  return e.tutto_il_giorno ? e.data_inizio.slice(0, 10) : dataLocale(new Date(e.data_inizio));
}

function giornoFine(e: Evento): string {
  return e.tutto_il_giorno ? e.data_fine.slice(0, 10) : dataLocale(new Date(e.data_fine));
}

function spostaGiorni(data: string, giorni: number): string {
  const [a, m, g] = data.split("-").map(Number);
  return dataLocale(new Date(a, m - 1, g + giorni));
}

function etichettaGiorno(data: string, oggi: string): string {
  if (data === oggi) return "Oggi";
  if (data === spostaGiorni(oggi, 1)) return "Domani";
  const [a, m, g] = data.split("-").map(Number);
  return new Date(a, m - 1, g).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
}

// "Cosa devo fare": gli eventi ancora da fare da oggi ai prossimi `giorni`,
// raggruppati per giorno. Un evento su più giorni già iniziato compare sotto
// Oggi; uno con orario già finito oggi sparisce. Stessa copertura inclusiva
// di data_fine usata dal pannello giorno (AgendaBoard).
export function prossimiImpegni(eventi: Evento[], adesso: Date, giorni = 7): GruppoImpegni[] {
  const oggi = dataLocale(adesso);
  const limite = spostaGiorni(oggi, giorni);

  const perGiorno = new Map<string, Evento[]>();
  for (const e of eventi) {
    const inizio = giornoInizio(e);
    if (inizio >= limite) continue;
    const ancoraDaFare = e.tutto_il_giorno ? giornoFine(e) >= oggi : new Date(e.data_fine) > adesso;
    if (!ancoraDaFare) continue;
    const giorno = inizio < oggi ? oggi : inizio;
    const lista = perGiorno.get(giorno) ?? [];
    lista.push(e);
    perGiorno.set(giorno, lista);
  }

  return [...perGiorno.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, lista]) => ({
      data,
      etichetta: etichettaGiorno(data, oggi),
      // Tutto il giorno prima, poi per orario.
      eventi: lista.sort((a, b) =>
        a.tutto_il_giorno !== b.tutto_il_giorno
          ? a.tutto_il_giorno
            ? -1
            : 1
          : a.data_inizio.localeCompare(b.data_inizio)
      ),
    }));
}
