// Etichette di data in fuso Europe/Rome per raggruppare le novità per giorno.

const GIORNO = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" });
const ESTESA = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", weekday: "long", day: "numeric", month: "long" });
const ORA = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" });

export function giornoRoma(iso: string): string {
  return GIORNO.format(new Date(iso));
}

export function etichettaGiorno(giorno: string, adesso: Date = new Date()): string {
  const oggi = GIORNO.format(adesso);
  const ieri = GIORNO.format(new Date(adesso.getTime() - 86_400_000));
  if (giorno === oggi) return "Oggi";
  if (giorno === ieri) return "Ieri";
  const testo = ESTESA.format(new Date(`${giorno}T12:00:00Z`));
  return testo.charAt(0).toUpperCase() + testo.slice(1);
}

export function oraRoma(iso: string): string {
  return ORA.format(new Date(iso));
}
