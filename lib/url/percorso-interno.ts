// Destinazione di un reindirizzamento presa dalla richiesta: si accetta solo un
// percorso di questo sito. Il parser degli URL fa da arbitro, perché "//host",
// "/\host" o un tab in mezzo iniziano con "/" ma portano altrove.
const BASE = "https://interno.invalid";

export function percorsoInterno(valore: string | null | undefined, ripiego: string): string {
  if (!valore?.startsWith("/")) return ripiego;
  try {
    const url = new URL(valore, BASE);
    if (url.origin !== BASE || url.pathname.startsWith("//")) return ripiego;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return ripiego;
  }
}
