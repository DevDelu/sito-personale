// Il syncToken di Google dice "da qui in poi ho già tutto". Se in una sync
// incrementale anche un solo evento non è stato scritto nel database, va tenuto
// quello precedente: al giro dopo Google rimanda le stesse modifiche e si riprova.
// Dopo una sync completa invece si avanza comunque: il precedente è assente o
// scaduto (410), e tenerlo farebbe ripetere per sempre la sync completa, che non
// riceve le cancellazioni. Così un evento che fallisce sempre non blocca il resto.
export function tokenDaSalvare(
  erroriPull: number,
  nuovo: string | null | undefined,
  precedente: string | null,
  syncCompleta = false
): string | null {
  if (syncCompleta) return nuovo ?? null;
  return erroriPull > 0 ? precedente : (nuovo ?? precedente);
}

// supabase-js non lancia eccezioni: l'errore arriva nella risposta.
export function verificaScrittura({ error }: { error: { message: string } | null }): void {
  if (error) throw new Error(error.message);
}
