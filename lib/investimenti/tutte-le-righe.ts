// PostgREST restituisce al massimo 1000 righe per richiesta, senza errore: una
// lettura "di tutto" va fatta a pagine. L'ordinamento della query deve essere
// univoco (nessuna riga a pari merito), altrimenti le pagine si sovrappongono.
export const RIGHE_PER_PAGINA = 1000;

type Pagina<T> = { data: T[] | null; error: { message: string } | null };

export async function tutteLeRighe<T>(leggi: (da: number, a: number) => PromiseLike<Pagina<T>>): Promise<T[]> {
  const righe: T[] = [];
  for (let da = 0; ; da += RIGHE_PER_PAGINA) {
    const { data, error } = await leggi(da, da + RIGHE_PER_PAGINA - 1);
    if (error) throw new Error(error.message);
    righe.push(...(data ?? []));
    if (!data || data.length < RIGHE_PER_PAGINA) return righe;
  }
}
