import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchCoinGeckoPrice, fetchYahooPrice } from "@/lib/investimenti/price-providers";
import { getPosizioniCorrenti } from "@/lib/investimenti/queries";

export type EsitoAggiornamentoPrezzi = {
  aggiornati: { asset_id: string; prezzo: number; data: string; fonte: string }[];
  errori: { asset_id: string; messaggio: string }[];
  snapshot: { data: string; valore_totale: number } | null;
};

// Aggiorna prezzi_storico per gli asset con una fonte prezzi collegata, poi
// scrive uno snapshot del valore totale del portafoglio. Va avanti asset per
// asset: un fallimento su un simbolo non blocca gli altri. Usata dal cron
// giornaliero e dall'aggiornamento all'apertura di /investimenti (il piano
// Hobby di Vercel permette un solo cron al giorno, troppo poco da solo).
export async function aggiornaPrezzi(): Promise<EsitoAggiornamentoPrezzi> {
  const admin = createAdminClient();
  const { data: assets, error } = await admin
    .from("assets")
    .select("id, price_symbol, coingecko_id");
  if (error) throw new Error(error.message);

  const aggiornati: EsitoAggiornamentoPrezzi["aggiornati"] = [];
  const errori: EsitoAggiornamentoPrezzi["errori"] = [];

  await Promise.all(
    (assets ?? []).map(async (asset) => {
      try {
        let quote: { prezzo: number; data: string } | null = null;
        let fonte: "yahoo" | "coingecko" | null = null;

        if (asset.coingecko_id) {
          quote = await fetchCoinGeckoPrice(asset.coingecko_id);
          fonte = "coingecko";
        } else if (asset.price_symbol) {
          quote = await fetchYahooPrice(asset.price_symbol);
          fonte = "yahoo";
        }

        if (!quote || !fonte) return; // nessuna fonte prezzi collegata per questo asset

        const { error: upsertError } = await admin
          .from("prezzi_storico")
          .upsert(
            { asset_id: asset.id, data: quote.data, prezzo: quote.prezzo, fonte },
            { onConflict: "asset_id,data" }
          );
        if (upsertError) throw new Error(upsertError.message);

        aggiornati.push({ asset_id: asset.id, prezzo: quote.prezzo, data: quote.data, fonte });
      } catch (e) {
        errori.push({ asset_id: asset.id, messaggio: (e as Error).message });
      }
    })
  );

  let snapshot: EsitoAggiornamentoPrezzi["snapshot"] = null;
  try {
    const posizioni = await getPosizioniCorrenti();
    const valoreTotale = posizioni.reduce((s, p) => s + (p.valoreAttuale ?? 0), 0);
    const oggi = new Date().toISOString().slice(0, 10);
    const { error: snapshotError } = await admin
      .from("portfolio_snapshot")
      .upsert({ data: oggi, valore_totale: valoreTotale }, { onConflict: "data" });
    if (snapshotError) throw new Error(snapshotError.message);
    snapshot = { data: oggi, valore_totale: valoreTotale };
  } catch (e) {
    errori.push({ asset_id: "snapshot", messaggio: (e as Error).message });
  }

  return { aggiornati, errori, snapshot };
}
