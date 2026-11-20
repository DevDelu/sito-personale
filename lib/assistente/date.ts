// Date in fuso Europe/Rome: su Vercel il server gira in UTC, e "oggi" a
// mezzanotte e mezza italiana sarebbe ancora ieri.

export function oggiRoma(adesso: Date = new Date()): string {
  // en-CA formatta già come YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(adesso);
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

// Accetta solo date ISO reali (niente 2026-02-30) e non oltre domani: un
// movimento futuro detto a voce è quasi sempre un errore di trascrizione.
export function dataValida(iso: unknown, oggi: string): iso is string {
  if (typeof iso !== "string" || !ISO.test(iso)) return false;
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso) return false;
  const domani = new Date(`${oggi}T00:00:00Z`);
  domani.setUTCDate(domani.getUTCDate() + 1);
  return d <= domani;
}

const NOMI_GIORNI = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];

export function giornoSettimana(iso: string): string {
  return NOMI_GIORNI[new Date(`${iso}T00:00:00Z`).getUTCDay()];
}

export function formattaEuro(n: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}
