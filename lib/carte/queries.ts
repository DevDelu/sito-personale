import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CollectionCard, CollectionOverview } from "./types";

function toNumberOrNull(v: unknown): number | null {
  return v === null || v === undefined ? null : Number(v);
}

function mapRow(row: Record<string, unknown>): CollectionCard {
  return {
    id: Number(row.id),
    card_id: Number(row.card_id),
    quantity: Number(row.quantity),
    condition: (row.condition as CollectionCard["condition"]) ?? null,
    language: (row.language as string | null) ?? "EN",
    is_foil: Boolean(row.is_foil),
    purchase_price: toNumberOrNull(row.purchase_price),
    manual_price: toNumberOrNull(row.manual_price),
    notes: (row.notes as string | null) ?? null,
    id_product: row.id_product === null || row.id_product === undefined ? null : Number(row.id_product),
    name: row.name as string,
    card_number: (row.card_number as string | null) ?? null,
    product_type: row.product_type as CollectionCard["product_type"],
    image_url: (row.image_url as string | null) ?? null,
    current_price: toNumberOrNull(row.current_price),
    is_manual_price: Boolean(row.is_manual_price),
    avg30: toNumberOrNull(row.avg30),
    snapshot_date: (row.snapshot_date as string | null) ?? null,
  };
}

const HERO_SIZE = 3;

export async function getCollectionOverview(): Promise<CollectionOverview> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("v_collection_current").select("*");
  if (error) throw new Error(error.message);

  const carte = (data ?? []).map(mapRow);

  // Prezzo più alto prima; le carte senza prezzo ancora noto (nessuno
  // snapshot importato) vanno in fondo, non in cima come "0".
  const ordinate = [...carte].sort((a, b) => {
    if (a.current_price === null && b.current_price === null) return 0;
    if (a.current_price === null) return 1;
    if (b.current_price === null) return -1;
    return b.current_price - a.current_price;
  });

  const hero = ordinate.slice(0, HERO_SIZE);
  const resto = ordinate.slice(HERO_SIZE);

  const valoreTotale = carte.reduce((s, c) => s + (c.current_price ?? 0) * c.quantity, 0);
  const numeroCarte = carte.length;

  return { hero, resto, valoreTotale, numeroCarte };
}

export type PricePoint = { date: string; price: number };

// Serie storica per il grafico nel popup di dettaglio: unisce lo storico
// Cardmarket (prices, se la carta ha un id_product) con lo storico dei
// prezzi manuali (manual_price_snapshots). Se una data ha entrambi, vince il
// prezzo manuale — stessa priorità del coalesce usato in v_collection_current.
export async function getPriceHistory(collectionId: number, idProduct: number | null): Promise<PricePoint[]> {
  const admin = createAdminClient();
  const byDate = new Map<string, number>();

  if (idProduct !== null) {
    const { data, error } = await admin
      .from("prices")
      .select("snapshot_date, trend")
      .eq("id_product", idProduct)
      .order("snapshot_date", { ascending: true });
    if (error) throw new Error(error.message);
    for (const row of data ?? []) {
      if (row.trend !== null && Number(row.trend) > 0) byDate.set(row.snapshot_date as string, Number(row.trend));
    }
  }

  const { data: manualData, error: manualError } = await admin
    .from("manual_price_snapshots")
    .select("snapshot_date, price")
    .eq("collection_id", collectionId)
    .order("snapshot_date", { ascending: true });
  if (manualError) throw new Error(manualError.message);
  for (const row of manualData ?? []) {
    byDate.set(row.snapshot_date as string, Number(row.price));
  }

  return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, price]) => ({ date, price }));
}
