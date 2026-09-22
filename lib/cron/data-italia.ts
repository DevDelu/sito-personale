// Helper condiviso dai cron di notifica (Alimentazione, Spese): i cron
// Vercel girano in UTC, ma "oggi"/"questa settimana" per i promemoria devono
// seguire il fuso di Lorenzo (Europe/Rome), non UTC — altrimenti intorno alla
// mezzanotte italiana si controlla il giorno sbagliato. Nessuna libreria di
// date aggiunta: bastano Intl e aritmetica su date UTC-ancorate.

// "YYYY-MM-DD" del giorno corrente in Europe/Rome (en-CA produce già questo
// formato).
export function oggiItaliaISO(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

// Lunedì-domenica della settimana corrente (Europe/Rome), come coppia di
// "YYYY-MM-DD". La data del giorno viene riletta come UTC-mezzanotte solo
// per fare aritmetica di calendario (giorno della settimana, +/- giorni):
// non è una nuova conversione di fuso, il fuso è già stato applicato sopra.
export function settimanaCorrenteItalia(date: Date = new Date()): { inizio: string; fine: string } {
  const oggi = new Date(`${oggiItaliaISO(date)}T00:00:00Z`);
  const giornoSettimana = oggi.getUTCDay(); // 0 = domenica .. 6 = sabato
  const offsetLunedi = giornoSettimana === 0 ? 6 : giornoSettimana - 1;

  const lunedi = new Date(oggi);
  lunedi.setUTCDate(oggi.getUTCDate() - offsetLunedi);
  const domenica = new Date(lunedi);
  domenica.setUTCDate(lunedi.getUTCDate() + 6);

  return { inizio: lunedi.toISOString().slice(0, 10), fine: domenica.toISOString().slice(0, 10) };
}
