import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { calcolaFifo } from "./fifo";
import type { Asset, Posizione, Transazione, TransazioneConAsset } from "./types";

function toNumber(v: unknown): number {
  return v === null || v === undefined ? 0 : Number(v);
}

function mapAsset(row: Record<string, unknown>): Asset {
  return {
    id: row.id as string,
    ticker: row.ticker as string,
    isin: (row.isin as string | null) ?? null,
    nome: row.nome as string,
    tipo: row.tipo as Asset["tipo"],
    valuta: row.valuta as string,
    price_symbol: (row.price_symbol as string | null) ?? null,
    coingecko_id: (row.coingecko_id as string | null) ?? null,
  };
}

function mapTransazione(row: Record<string, unknown>): Transazione {
  return {
    id: row.id as string,
    asset_id: row.asset_id as string,
    tipo: row.tipo as Transazione["tipo"],
    quantita: toNumber(row.quantita),
    prezzo_unitario: row.prezzo_unitario === null ? null : toNumber(row.prezzo_unitario),
    data: row.data as string,
    costo_tipo: row.costo_tipo as Transazione["costo_tipo"],
    note: (row.note as string | null) ?? null,
  };
}

export async function getAssets(): Promise<Asset[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("assets").select("*").order("nome");
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAsset);
}

export async function getTransazioni(): Promise<TransazioneConAsset[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("transazioni_con_asset")
    .select("*")
    .order("data", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    ...mapTransazione(row),
    ticker: row.ticker,
    asset_nome: row.asset_nome,
    asset_tipo: row.asset_tipo,
    valuta: row.valuta,
  }));
}

// Nessun cron di aggiornamento prezzi ancora collegato in questa fase (manca
// una API key Twelve Data): se non c'è un prezzo in prezzi_storico, si usa
// come stima il prezzo dell'ultima transazione di acquisto nota, segnalato
// in UI come "non aggiornato" invece di un valore di mercato reale.
export async function getPosizioniCorrenti(): Promise<Posizione[]> {
  const admin = createAdminClient();
  const [assetsRes, transazioniRes, prezziRes] = await Promise.all([
    admin.from("assets").select("*").order("nome"),
    admin.from("transazioni").select("*"),
    admin
      .from("prezzi_storico")
      .select("asset_id, data, prezzo")
      .order("data", { ascending: false }),
  ]);

  if (assetsRes.error) throw new Error(assetsRes.error.message);
  if (transazioniRes.error) throw new Error(transazioniRes.error.message);
  if (prezziRes.error) throw new Error(prezziRes.error.message);

  const ultimoPrezzo = new Map<string, { prezzo: number; data: string }>();
  for (const p of prezziRes.data ?? []) {
    if (!ultimoPrezzo.has(p.asset_id)) {
      ultimoPrezzo.set(p.asset_id, { prezzo: toNumber(p.prezzo), data: p.data });
    }
  }

  const transazioniPerAsset = new Map<string, Transazione[]>();
  for (const row of transazioniRes.data ?? []) {
    const t = mapTransazione(row);
    const list = transazioniPerAsset.get(t.asset_id) ?? [];
    list.push(t);
    transazioniPerAsset.set(t.asset_id, list);
  }

  const posizioni: Posizione[] = [];

  for (const assetRow of assetsRes.data ?? []) {
    const asset = mapAsset(assetRow);
    const transazioni = transazioniPerAsset.get(asset.id) ?? [];
    if (transazioni.length === 0) continue;

    const fifo = calcolaFifo(transazioni);
    if (fifo.quantitaNetta <= 1e-9) continue; // posizione chiusa

    const costoMedioCarico =
      fifo.quantitaCostoNoto > 1e-9 ? fifo.costoTotaleCarico / fifo.quantitaCostoNoto : null;

    let prezzoAttuale: number | null = null;
    let prezzoAttualeData: string | null = null;
    let prezzoAttualeFonte: Posizione["prezzoAttualeFonte"] = null;

    const storico = ultimoPrezzo.get(asset.id);
    if (storico) {
      prezzoAttuale = storico.prezzo;
      prezzoAttualeData = storico.data;
      prezzoAttualeFonte = "prezzi_storico";
    } else {
      const ultimaBuyConPrezzo = [...transazioni]
        .filter((t) => t.tipo === "buy" && t.prezzo_unitario !== null)
        .sort((a, b) => b.data.localeCompare(a.data))[0];
      if (ultimaBuyConPrezzo) {
        prezzoAttuale = ultimaBuyConPrezzo.prezzo_unitario;
        prezzoAttualeData = ultimaBuyConPrezzo.data;
        prezzoAttualeFonte = "ultima_transazione";
      }
    }

    const valoreAttuale = prezzoAttuale !== null ? fifo.quantitaNetta * prezzoAttuale : null;

    let plusvalenzaAssoluta: number | null = null;
    let plusvalenzaPercentuale: number | null = null;
    if (valoreAttuale !== null && fifo.quantitaCostoNoto > 1e-9 && prezzoAttuale !== null) {
      const valoreQuotaNota = fifo.quantitaCostoNoto * prezzoAttuale;
      plusvalenzaAssoluta = valoreQuotaNota - fifo.costoTotaleCarico;
      plusvalenzaPercentuale =
        fifo.costoTotaleCarico > 1e-9 ? (plusvalenzaAssoluta / fifo.costoTotaleCarico) * 100 : null;
    }

    posizioni.push({
      asset,
      quantitaNetta: fifo.quantitaNetta,
      quantitaCostoNoto: fifo.quantitaCostoNoto,
      costoTotaleCarico: fifo.costoTotaleCarico,
      costoMedioCarico,
      prezzoAttuale,
      prezzoAttualeData,
      prezzoAttualeFonte,
      valoreAttuale,
      plusvalenzaAssoluta,
      plusvalenzaPercentuale,
      hasStimato: fifo.hasStimato,
      hasSconosciuto: fifo.hasSconosciuto,
    });
  }

  return posizioni.sort((a, b) => (b.valoreAttuale ?? 0) - (a.valoreAttuale ?? 0));
}

export async function getPortfolioSnapshots(): Promise<{ data: string; valore_totale: number }[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("portfolio_snapshot")
    .select("data, valore_totale")
    .order("data", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ data: r.data, valore_totale: toNumber(r.valore_totale) }));
}
