// Prima di lanciare 40+ test, una sola richiesta di prova a una pagina
// privata con la sessione del tester: se il sito non lo fa entrare, il
// collaudo si ferma subito dicendo PERCHÉ, invece di far fallire ogni test
// con "non deve rimandare al login" (che non distingue tra la protezione
// delle anteprime Vercel e il sito che non riconosce il tester).
// Nei log di un repo pubblico finiscono solo host, percorso e un sì/no sul
// bypass: mai valori di secret né contenuti.

export type EsitoProva = { status: number; location: string | null; erroreVercel?: string | null };

export function diagnosiAccesso(baseURL: string, prova: EsitoProva, bypassImpostato: boolean): string | null {
  // Sito spento da Vercel (limiti del piano superati, pagamento richiesto):
  // senza questo falliscono tutti i test con un generico "status HTTP".
  if (prova.status === 402) {
    const codice = /^[A-Z_]{1,60}$/.test(prova.erroreVercel ?? "") ? ` ${prova.erroreVercel}` : "";
    return (
      `Collaudo fermato: ${new URL(baseURL).host} è sospeso da Vercel (402${codice}). ` +
      `Non è un errore del codice: controlla Vercel > Usage e le email di Vercel.`
    );
  }
  if (prova.status < 300 || prova.status >= 400) return null; // nessun redirect: la pagina si apre
  if (!prova.location) return null;
  let dest: URL;
  try {
    dest = new URL(prova.location, baseURL);
  } catch {
    return null;
  }
  const bypass = bypassImpostato ? "VERCEL_BYPASS_SECRET è impostato (ma Vercel non lo accetta)" : "VERCEL_BYPASS_SECRET NON è impostato";
  if (/(^|\.)vercel\.com$/.test(dest.hostname)) {
    return (
      `Collaudo fermato: ${new URL(baseURL).host} è protetta da Vercel (redirect verso ${dest.hostname}${dest.pathname}). ` +
      `${bypass}. Controlla il secret VERCEL_BYPASS_SECRET su GitHub (Actions, repository secret) e ` +
      `Deployment Protection > Protection Bypass for Automation su Vercel: i valori devono coincidere.`
    );
  }
  if (dest.pathname === "/login") {
    return (
      `Collaudo fermato: il sito ${new URL(baseURL).host} non riconosce il tester (redirect a ${dest.pathname}). ` +
      `La sessione è valida (il login Supabase è riuscito): controlla TESTER_EMAIL e OWNER_EMAIL per questo ambiente su Vercel ` +
      `(Preview incluso, serve un nuovo deploy) e che SUPABASE_URL/SUPABASE_ANON_KEY dei secret GitHub siano dello stesso progetto del sito.`
    );
  }
  return null;
}
