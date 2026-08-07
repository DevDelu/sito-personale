import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchCoinGeckoHistory, fetchYahooHistory } from "@/lib/investimenti/price-providers";

// Backfill una tantum, da lanciare a mano da loggato (non dal cron
// giornaliero, che resta invariato): scarica lo storico prezzi dalla data
// della prima transazione di ogni asset, non solo da quando il cron ha
// iniziato a girare. Protetta da sessione utente (getUser(), stesso pattern
// delle altre API route del modulo), non dal CRON_SECRET.
export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const admin = createAdminClient();
  const { data: assets, error } = await admin
    .from("assets")
    .select("id, ticker, price_symbol, coingecko_id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const aggiornati: { asset_id: string; ticker: string; punti: number }[] = [];
  const errori: { asset_id: string; ticker: string; messaggio: string }[] = [];

  for (const asset of assets ?? []) {
    if (!asset.price_symbol && !asset.coingecko_id) continue; // nessuna fonte prezzi collegata

    try {
      const { data: primaTransazione, error: txError } = await admin
        .from("transazioni")
        .select("data")
        .eq("asset_id", asset.id)
        .order("data", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (txError) throw new Error(txError.message);
      if (!primaTransazione) continue; // nessuna transazione, niente da scaricare

      let quotes: { prezzo: number; data: string }[] = [];
      let fonte: "yahoo" | "coingecko" = "yahoo";
      if (asset.coingecko_id) {
        try {
          quotes = await fetchCoinGeckoHistory(asset.coingecko_id, primaTransazione.data);
          fonte = "coingecko";
        } catch (coingeckoError) {
          // Il piano gratuito di CoinGecko richiede una API key per lo storico
          // (/market_chart/range), a differenza del prezzo live usato dal cron
          // (/simple/price, resta invariato): se l'asset ha anche un ticker
          // Yahoo (es. BTC-EUR), usalo come fallback solo per il backfill.
          if (asset.price_symbol) {
            quotes = await fetchYahooHistory(asset.price_symbol, primaTransazione.data);
            fonte = "yahoo";
          } else {
            throw coingeckoError;
          }
        }
      } else if (asset.price_symbol) {
        quotes = await fetchYahooHistory(asset.price_symbol, primaTransazione.data);
        fonte = "yahoo";
      }

      if (quotes.length === 0) continue;

      const { error: upsertError } = await admin
        .from("prezzi_storico")
        .upsert(
          quotes.map((q) => ({ asset_id: asset.id, data: q.data, prezzo: q.prezzo, fonte })),
          { onConflict: "asset_id,data" }
        );
      if (upsertError) throw new Error(upsertError.message);

      aggiornati.push({ asset_id: asset.id, ticker: asset.ticker, punti: quotes.length });
    } catch (e) {
      errori.push({ asset_id: asset.id, ticker: asset.ticker, messaggio: (e as Error).message });
    }
  }

  return NextResponse.json({ aggiornati, errori });
}
