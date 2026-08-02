"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/dal";
import type { CardCondition, ProductType } from "@/lib/carte/types";

export type AggiungiCartaState = { error?: string } | undefined;

const PRODUCT_TYPES: ProductType[] = ["carta", "energy_marker", "sigillato"];
const CONDITIONS: CardCondition[] = ["NM", "EX", "GD", "LP", "PL", "PO"];

function isProductType(v: string): v is ProductType {
  return (PRODUCT_TYPES as string[]).includes(v);
}

function isCondition(v: string): v is CardCondition {
  return (CONDITIONS as string[]).includes(v);
}

const IMAGE_BUCKET = "card-images";

export async function aggiungiCarta(
  _prevState: AggiungiCartaState,
  formData: FormData
): Promise<AggiungiCartaState> {
  await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const setCode = String(formData.get("set_code") ?? "").trim() || null;
  const cardNumber = String(formData.get("card_number") ?? "").trim();
  const productTypeRaw = String(formData.get("product_type") ?? "carta").trim();
  const productType: ProductType = isProductType(productTypeRaw) ? productTypeRaw : "carta";
  const quantityRaw = String(formData.get("quantity") ?? "1").trim();
  const quantity = Number(quantityRaw);
  const conditionRaw = String(formData.get("condition") ?? "NM").trim();
  const condition: CardCondition = isCondition(conditionRaw) ? conditionRaw : "NM";
  const language = String(formData.get("language") ?? "EN").trim() || "EN";
  const isFoil = formData.get("is_foil") === "on";
  const purchasePriceRaw = String(formData.get("purchase_price") ?? "").replace(",", ".").trim();
  const purchasePrice = purchasePriceRaw ? Number(purchasePriceRaw) : null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const imageFile = formData.get("image");

  if (!name) return { error: "Il nome della carta è obbligatorio." };
  if (!cardNumber) return { error: "Il numero carta è obbligatorio." };
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { error: "La quantità deve essere un numero positivo." };
  }
  if (purchasePriceRaw && (!Number.isFinite(purchasePrice) || (purchasePrice as number) < 0)) {
    return { error: "Il prezzo di acquisto deve essere un numero valido." };
  }

  const admin = createAdminClient();

  // L'ID Cardmarket non si inserisce più a mano: si ricava in un secondo
  // momento (flusso manuale via chat) da codice set + numero carta e viene
  // scritto direttamente su fusion_world_cards.id_product via SQL.
  let imageUrl: string | null = null;
  if (imageFile instanceof File && imageFile.size > 0) {
    const ext = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await admin.storage
      .from(IMAGE_BUCKET)
      .upload(path, imageFile, { contentType: imageFile.type || undefined });
    if (uploadError) return { error: uploadError.message };
    imageUrl = admin.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
  }

  const { data: cardRow, error: cardError } = await admin
    .from("fusion_world_cards")
    .insert({
      name,
      set_code: setCode,
      card_number: cardNumber,
      product_type: productType,
      source: "manuale",
      image_url: imageUrl,
    })
    .select("id")
    .single();
  if (cardError) return { error: cardError.message };
  const cardId = cardRow.id as number;

  const { error: collectionError } = await admin.from("my_collection").insert({
    card_id: cardId,
    quantity,
    condition,
    language,
    is_foil: isFoil,
    purchase_price: purchasePrice,
    notes,
  });
  if (collectionError) return { error: collectionError.message };

  revalidatePath("/carte");
  redirect("/carte?added=1");
}
