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
    is_foil: Boolean(row.is_foil),
    purchase_price: toNumberOrNull(row.purchase_price),
    id_product: row.id_product === null || row.id_product === undefined ? null : Number(row.id_product),
    name: row.name as string,
    product_type: row.product_type as CollectionCard["product_type"],
    image_url: (row.image_url as string | null) ?? null,
    current_price: toNumberOrNull(row.current_price),
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
