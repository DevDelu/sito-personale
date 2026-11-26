// Il syncToken di Google dice "da qui in poi ho già tutto". Se anche un solo
// evento non è stato scritto nel database, va tenuto quello precedente: alla
// sincronizzazione successiva Google rimanda le stesse modifiche e si riprova.
export function tokenDaSalvare(
  erroriPull: number,
  nuovo: string | null | undefined,
  precedente: string | null
): string | null {
  return erroriPull > 0 ? precedente : (nuovo ?? precedente);
}

// supabase-js non lancia eccezioni: l'errore arriva nella risposta.
export function verificaScrittura({ error }: { error: { message: string } | null }): void {
  if (error) throw new Error(error.message);
}
