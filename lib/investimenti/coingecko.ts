// Richiesta e risposta di CoinGecko /simple/price per più cripto insieme. Puro, testato.
type Prezzo = { prezzo: number; data: string };

export function urlPrezziCoinGecko(ids: string[], vsCurrency: string): string {
  return `https://api.coingecko.com/api/v3/simple/price?ids=${ids.map(encodeURIComponent).join(",")}&vs_currencies=${vsCurrency}`;
}

// Restituisce solo gli id con un prezzo valido: ogni prezzo resta legato al suo id.
export function leggiPrezziCoinGecko(json: unknown, ids: string[], vsCurrency: string, data: string): Map<string, Prezzo> {
  const risposta = json as Record<string, Record<string, unknown> | undefined> | null;
  const out = new Map<string, Prezzo>();
  for (const id of ids) {
    const prezzo = risposta?.[id]?.[vsCurrency];
    if (typeof prezzo === "number") out.set(id, { prezzo, data });
  }
  return out;
}
