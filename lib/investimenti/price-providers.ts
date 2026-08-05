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

// Backfill una tantum (non nel cron giornaliero): storico giornaliero da
// `fromDate` a oggi. Stesso endpoint chart non ufficiale di fetchYahooPrice,
// con period1/period2 invece di range.
export async function fetchYahooHistory(symbol: string, fromDate: string): Promise<PriceQuote[]> {
  const period1 = Math.floor(new Date(`${fromDate}T00:00:00Z`).getTime() / 1000);
  const period2 = Math.floor(Date.now() / 1000);
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&period1=${period1}&period2=${period2}`,
    { headers: { "User-Agent": "Mozilla/5.0" } }
  );
  if (!res.ok) throw new Error(`Yahoo Finance: HTTP ${res.status} per ${symbol}`);

  const json = await res.json();
  const result = json?.chart?.result?.[0];
  const timestamps: unknown[] = result?.timestamp ?? [];
  const closes: unknown[] = result?.indicators?.quote?.[0]?.close ?? [];
  if (timestamps.length === 0) {
    throw new Error(`Yahoo Finance: nessuno storico disponibile per ${symbol}`);
  }

  const quotes: PriceQuote[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const ts = timestamps[i];
    const close = closes[i];
    if (typeof ts !== "number" || typeof close !== "number") continue;
    quotes.push({ prezzo: close, data: new Date(ts * 1000).toISOString().slice(0, 10) });
  }
  return quotes;
}

// Backfill una tantum: storico giornaliero da `fromDate` a oggi. La risposta
// di CoinGecko può essere più granulare di un punto al giorno (oraria per
// range brevi): teniamo solo l'ultimo prezzo di ogni giorno.
export async function fetchCoinGeckoHistory(
  id: string,
  fromDate: string,
  vsCurrency = "eur"
): Promise<PriceQuote[]> {
  const from = Math.floor(new Date(`${fromDate}T00:00:00Z`).getTime() / 1000);
  const to = Math.floor(Date.now() / 1000);
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/market_chart/range?vs_currency=${vsCurrency}&from=${from}&to=${to}`
  );
  if (!res.ok) throw new Error(`CoinGecko: HTTP ${res.status} per ${id}`);

  const json = await res.json();
  const prices: unknown[] = json?.prices ?? [];

  const perGiorno = new Map<string, number>();
  for (const point of prices) {
    if (!Array.isArray(point) || point.length < 2) continue;
    const [timestampMs, prezzo] = point;
    if (typeof timestampMs !== "number" || typeof prezzo !== "number") continue;
    const giorno = new Date(timestampMs).toISOString().slice(0, 10);
    perGiorno.set(giorno, prezzo); // sovrascrive: resta l'ultimo del giorno
  }

  return [...perGiorno.entries()].map(([data, prezzo]) => ({ prezzo, data }));
}
