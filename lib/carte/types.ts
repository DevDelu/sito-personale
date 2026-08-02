export type ProductType = "carta" | "energy_marker" | "sigillato";

export type CollectionCard = {
  id_product: number;
  quantity: number;
  name: string;
  product_type: ProductType;
  image_url: string | null;
  current_price: number | null;
  avg30: number | null;
  snapshot_date: string | null;
};

export type CollectionOverview = {
  hero: CollectionCard[];
  resto: CollectionCard[];
  valoreTotale: number;
  numeroCarte: number;
};
