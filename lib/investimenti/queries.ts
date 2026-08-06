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
    quantita_riferimento_manuale:
      row.quantita_riferimento_manuale === null || row.quantita_riferimento_manuale === undefined
        ? null
        : toNumber(row.quantita_riferimento_manuale),
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

    // Se lo storico transazioni è incompleto (asset.quantita_riferimento_manuale
    // valorizzato e diverso dalla quantità netta calcolata), il valore di
    // mercato usa il riferimento manuale — costo/plusvalenza restano invece
    // sempre calcolati solo sulle transazioni note, e mai su questo dato.
    const riferimento = asset.quantita_riferimento_manuale;
    const datiIncompleti = riferimento !== null && Math.abs(riferimento - fifo.quantitaNetta) > 1e-9;
    const quantitaValore = riferimento !== null ? riferimento : fifo.quantitaNetta;

    const valoreAttuale = prezzoAttuale !== null ? quantitaValore * prezzoAttuale : null;

    let plusvalenzaAssoluta: number | null = null;
    let plusvalenzaPercentuale: number | null = null;
    if (fifo.quantitaCostoNoto > 1e-9 && prezzoAttuale !== null) {
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
      quantitaValore,
      datiIncompleti,
    });
  }

  return posizioni.sort((a, b) => (b.valoreAttuale ?? 0) - (a.valoreAttuale ?? 0));
}

export type Riconciliazione = { asset: Asset; quantitaCalcolata: number; differenza: number };

// Asset con una quantita_riferimento_manuale che diverge dalla somma delle
// transazioni caricate: segnala uno storico incompleto in Gestione invece
// di lasciarlo emergere solo silenziosamente nel valore di Overview.
export async function getRiconciliazioneAsset(): Promise<Riconciliazione[]> {
  const admin = createAdminClient();
  const [assetsRes, transazioniRes] = await Promise.all([
    admin.from("assets").select("*").not("quantita_riferimento_manuale", "is", null),
    admin.from("transazioni").select("asset_id, tipo, quantita"),
  ]);
  if (assetsRes.error) throw new Error(assetsRes.error.message);
  if (transazioniRes.error) throw new Error(transazioniRes.error.message);

  const nettoPerAsset = new Map<string, number>();
  for (const t of transazioniRes.data ?? []) {
    const segno = t.tipo === "buy" ? 1 : -1;
    nettoPerAsset.set(t.asset_id, (nettoPerAsset.get(t.asset_id) ?? 0) + segno * toNumber(t.quantita));
  }

  const risultato: Riconciliazione[] = [];
  for (const row of assetsRes.data ?? []) {
    const asset = mapAsset(row);
    const quantitaCalcolata = nettoPerAsset.get(asset.id) ?? 0;
    const riferimento = asset.quantita_riferimento_manuale as number;
    const differenza = riferimento - quantitaCalcolata;
    if (Math.abs(differenza) > 1e-9) risultato.push({ asset, quantitaCalcolata, differenza });
  }
  return risultato;
}

export type GruppoStorico = { chiave: string; label: string };
export type PuntoPortafoglio = { data: string; totale: number } & Record<string, number | string>;

// "etf"/"etc" per i rispettivi tipi asset, un gruppo per ticker per ogni
// crypto (oggi solo BTC) — stessa suddivisione a 3 vie usata da
// AllocationChart (dopo l'introduzione del tipo 'etc').
function gruppoDiAsset(asset: Asset): GruppoStorico {
  if (asset.tipo === "crypto") return { chiave: asset.ticker.toLowerCase(), label: asset.ticker };
  if (asset.tipo === "etc") return { chiave: "etc", label: "ETC" };
  return { chiave: "etf", label: "ETF" };
}

// Storico valore portafoglio dalla prima transazione reale (non da quando
// gira il cron): niente nuove tabelle, le transazioni + prezzi_storico
// restano l'unica fonte di verità. Per ogni giorno calcola la quantità netta
// per asset (somma cumulata buy/sell) e il prezzo (ultimo noto <= giorno,
// forward-fill), poi somma per gruppo. Se `from` è passato, filtra i punti
// restituiti ma il calcolo della quantità parte comunque dall'inizio reale,
// altrimenti la quantità di partenza sarebbe sbagliata.
export async function getPortfolioHistoryByAsset(
  from?: string,
  to?: string
): Promise<{ punti: PuntoPortafoglio[]; gruppi: GruppoStorico[] }> {
  const admin = createAdminClient();
  const [assetsRes, transazioniRes, prezziRes] = await Promise.all([
    admin.from("assets").select("*").order("nome"),
    admin.from("transazioni").select("*").order("data", { ascending: true }),
    admin.from("prezzi_storico").select("asset_id, data, prezzo").order("data", { ascending: true }),
  ]);
  if (assetsRes.error) throw new Error(assetsRes.error.message);
  if (transazioniRes.error) throw new Error(transazioniRes.error.message);
  if (prezziRes.error) throw new Error(prezziRes.error.message);

  const assets = (assetsRes.data ?? []).map(mapAsset);
  const transazioni = (transazioniRes.data ?? []).map(mapTransazione);
  if (transazioni.length === 0) return { punti: [], gruppi: [] };

  const primaData = transazioni[0].data;
  const oggi = new Date().toISOString().slice(0, 10);
  const dataFine = to && to < oggi ? to : oggi; // niente punti nel futuro
  if (primaData > dataFine) return { punti: [], gruppi: [] };

  const gruppoPerAsset = new Map<string, GruppoStorico>();
  const gruppi = new Map<string, GruppoStorico>();
  for (const asset of assets) {
    const g = gruppoDiAsset(asset);
    gruppoPerAsset.set(asset.id, g);
    if (!gruppi.has(g.chiave)) gruppi.set(g.chiave, g);
  }

  const transazioniPerAsset = new Map<string, Transazione[]>();
  for (const t of transazioni) {
    const list = transazioniPerAsset.get(t.asset_id) ?? [];
    list.push(t);
    transazioniPerAsset.set(t.asset_id, list);
  }

  const prezziPerAsset = new Map<string, { data: string; prezzo: number }[]>();
  for (const p of prezziRes.data ?? []) {
    const list = prezziPerAsset.get(p.asset_id as string) ?? [];
    list.push({ data: p.data as string, prezzo: toNumber(p.prezzo) });
    prezziPerAsset.set(p.asset_id as string, list);
  }

  // Stato incrementale per asset, avanzato giorno per giorno: indice della
  // prossima transazione/prezzo da applicare, quantità corrente, ultimo
  // prezzo noto.
  const stato = new Map<string, { txIdx: number; prezzoIdx: number; quantita: number; prezzo: number | null }>();
  for (const asset of assets) stato.set(asset.id, { txIdx: 0, prezzoIdx: 0, quantita: 0, prezzo: null });

  const punti: PuntoPortafoglio[] = [];
  const giornoMs = 24 * 60 * 60 * 1000;
  const inizio = new Date(`${primaData}T00:00:00Z`).getTime();
  const fine = new Date(`${dataFine}T00:00:00Z`).getTime();

  for (let t = inizio; t <= fine; t += giornoMs) {
    const giorno = new Date(t).toISOString().slice(0, 10);
    const valorePerGruppo = new Map<string, number>();

    for (const asset of assets) {
      const s = stato.get(asset.id)!;
      const transazioniAsset = transazioniPerAsset.get(asset.id) ?? [];
      while (s.txIdx < transazioniAsset.length && transazioniAsset[s.txIdx].data <= giorno) {
        const tx = transazioniAsset[s.txIdx];
        s.quantita += tx.tipo === "buy" ? tx.quantita : -tx.quantita;
        s.txIdx++;
      }

      const prezziAsset = prezziPerAsset.get(asset.id) ?? [];
      while (s.prezzoIdx < prezziAsset.length && prezziAsset[s.prezzoIdx].data <= giorno) {
        s.prezzo = prezziAsset[s.prezzoIdx].prezzo;
        s.prezzoIdx++;
      }

      if (s.quantita <= 1e-9 || s.prezzo === null) continue;
      const valore = s.quantita * s.prezzo;
      const g = gruppoPerAsset.get(asset.id)!;
      valorePerGruppo.set(g.chiave, (valorePerGruppo.get(g.chiave) ?? 0) + valore);
    }

    let totale = 0;
    const punto: PuntoPortafoglio = { data: giorno, totale: 0 };
    for (const [chiave, valore] of valorePerGruppo) {
      punto[chiave] = valore;
      totale += valore;
    }
    punto.totale = totale;
    punti.push(punto);
  }

  const puntiFiltrati = from && from > primaData ? punti.filter((p) => p.data >= from) : punti;

  return { punti: puntiFiltrati, gruppi: [...gruppi.values()] };
}
