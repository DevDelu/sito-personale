import { ATTRITO_TIPI, type AttritoEvento } from "../feedback/types.ts";

// Pagina e contesto d'errore che il browser manda con ogni turno della
// conversazione a voce. Puri e testati: arrivano dal client, si validano.

// /novita/resoconti/3f2b… → /novita/resoconti/[id]: nel campo route va il
// modello della pagina (finisce nelle issue pubbliche), l'URL vero resta in url.
export function routeModello(pagina: string): string {
  return pagina
    .split("?")[0]
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/gi, "/[id]")
    .replace(/\/\d+(?=\/|$)/g, "/[id]");
}

// Solo percorsi interni dell'area privata, senza query (può contenere filtri
// con importi) e senza caratteri strani.
export function paginaValida(grezza: unknown): string | undefined {
  if (typeof grezza !== "string") return undefined;
  const p = grezza.split("?")[0].trim();
  if (!/^\/[A-Za-z0-9\-_/[\]]{0,120}$/.test(p) || p.startsWith("//")) return undefined;
  return p;
}

export function attritoValido(grezzo: unknown): AttritoEvento | undefined {
  if (!grezzo || typeof grezzo !== "object") return undefined;
  const a = grezzo as Record<string, unknown>;
  const pagina = paginaValida(a.pagina);
  if (typeof a.tipo !== "string" || !pagina) return undefined;
  if (!(ATTRITO_TIPI as readonly string[]).includes(a.tipo)) return undefined;
  return {
    tipo: a.tipo as AttritoEvento["tipo"],
    pagina,
    at: typeof a.at === "string" ? a.at.slice(0, 40) : new Date().toISOString(),
    ...(typeof a.dettaglio === "string" ? { dettaglio: a.dettaglio.slice(0, 200) } : {}),
  };
}
