export type ProductType = "carta" | "energy_marker" | "sigillato";
export type CardCondition = "NM" | "EX" | "GD" | "LP" | "PL" | "PO";

export type CollectionCard = {
  id: number;
  card_id: number;
  quantity: number;
  condition: CardCondition | null;
  language: string;
  is_foil: boolean;
  purchase_price: number | null;
  manual_price: number | null;
  notes: string | null;
  id_product: number | null;
  name: string;
  card_number: string | null;
  product_type: ProductType;
  image_url: string | null;
  current_price: number | null;
  is_manual_price: boolean;
  avg30: number | null;
  snapshot_date: string | null;
};

export type CollectionOverview = {
  hero: CollectionCard[];
  resto: CollectionCard[];
  valoreTotale: number;
  numeroCarte: number;
};
