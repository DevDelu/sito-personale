import "server-only";

export type PriceQuote = { prezzo: number; data: string };

// Endpoint chart non ufficiale di Yahoo Finance: gratuito, nessuna chiave,
// ma non documentato/garantito da Yahoo. Usato per gli ETF/ETC UCITS
// europei, non coperti dal piano free di Twelve Data (verificato a mano).
export async function fetchYahooPrice(symbol: string): Promise<PriceQuote> {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`,
    { headers: { "User-Agent": "Mozilla/5.0" } }
  );
  if (!res.ok) throw new Error(`Yahoo Finance: HTTP ${res.status} per ${symbol}`);

  const json = await res.json();
  const meta = json?.chart?.result?.[0]?.meta;
  const prezzo = meta?.regularMarketPrice;
  const timestamp = meta?.regularMarketTime;
  if (typeof prezzo !== "number" || typeof timestamp !== "number") {
    throw new Error(`Yahoo Finance: risposta senza prezzo valido per ${symbol}`);
  }

  return { prezzo, data: new Date(timestamp * 1000).toISOString().slice(0, 10) };
}

export async function fetchCoinGeckoPrice(id: string, vsCurrency = "eur"): Promise<PriceQuote> {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=${vsCurrency}`
  );
  if (!res.ok) throw new Error(`CoinGecko: HTTP ${res.status} per ${id}`);

  const json = await res.json();
  const prezzo = json?.[id]?.[vsCurrency];
  if (typeof prezzo !== "number") {
    throw new Error(`CoinGecko: risposta senza prezzo valido per ${id}`);
  }

  return { prezzo, data: new Date().toISOString().slice(0, 10) };
}
