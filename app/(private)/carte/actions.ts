"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/dal";
import { getPriceHistory, type PricePoint } from "@/lib/carte/queries";
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

// Il prezzo manuale non sovrascrive più un singolo valore: ogni salvataggio
// scrive (o aggiorna) lo snapshot di oggi in manual_price_snapshots, così lo
// storico resta disponibile per il grafico. Svuotare il campo cancella solo
// lo snapshot odierno, non l'intero storico.
async function salvaPrezzoManualeOggi(
  admin: ReturnType<typeof createAdminClient>,
  collectionId: number,
  manualPrice: number | null
) {
  const today = new Date().toISOString().slice(0, 10);
  if (manualPrice === null) {
    return admin
      .from("manual_price_snapshots")
      .delete()
      .eq("collection_id", collectionId)
      .eq("snapshot_date", today);
  }
  return admin
    .from("manual_price_snapshots")
    .upsert(
      { collection_id: collectionId, snapshot_date: today, price: manualPrice },
      { onConflict: "collection_id,snapshot_date" }
    );
}

async function caricaImmagine(
  admin: ReturnType<typeof createAdminClient>,
  imageFile: File
): Promise<{ url: string } | { error: string }> {
  const ext = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await admin.storage
    .from(IMAGE_BUCKET)
    .upload(path, imageFile, { contentType: imageFile.type || undefined });
  if (uploadError) return { error: uploadError.message };
  return { url: admin.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl };
}

export async function aggiungiCarta(
  _prevState: AggiungiCartaState,
  formData: FormData
): Promise<AggiungiCartaState> {
  await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const cardNumber = String(formData.get("card_number") ?? "").trim();
  const productTypeRaw = String(formData.get("product_type") ?? "carta").trim();
  const productType: ProductType = isProductType(productTypeRaw) ? productTypeRaw : "carta";
  const quantityRaw = String(formData.get("quantity") ?? "1").trim();
  const quantity = Number(quantityRaw);
  const conditionRaw = String(formData.get("condition") ?? "NM").trim();
  const condition: CardCondition = isCondition(conditionRaw) ? conditionRaw : "NM";
  const language = String(formData.get("language") ?? "EN").trim() || "EN";
  const purchasePriceRaw = String(formData.get("purchase_price") ?? "").replace(",", ".").trim();
  const purchasePrice = purchasePriceRaw ? Number(purchasePriceRaw) : null;
  const manualPriceRaw = String(formData.get("manual_price") ?? "").replace(",", ".").trim();
  const manualPrice = manualPriceRaw ? Number(manualPriceRaw) : null;
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
  if (manualPriceRaw && (!Number.isFinite(manualPrice) || (manualPrice as number) < 0)) {
    return { error: "Il prezzo attuale manuale deve essere un numero valido." };
  }

  const admin = createAdminClient();

  // L'ID Cardmarket non si inserisce più a mano: si ricava in un secondo
  // momento (flusso manuale via chat) dal numero carta e viene scritto
  // direttamente su fusion_world_cards.id_product via SQL.
  let imageUrl: string | null = null;
  if (imageFile instanceof File && imageFile.size > 0) {
    const uploaded = await caricaImmagine(admin, imageFile);
    if ("error" in uploaded) return { error: uploaded.error };
    imageUrl = uploaded.url;
  }

  const { data: cardRow, error: cardError } = await admin
    .from("fusion_world_cards")
    .insert({
      name,
      card_number: cardNumber,
      product_type: productType,
      source: "manuale",
      image_url: imageUrl,
    })
    .select("id")
    .single();
  if (cardError) return { error: cardError.message };
  const cardId = cardRow.id as number;

  const { data: collectionRow, error: collectionError } = await admin
    .from("my_collection")
    .insert({
      card_id: cardId,
      quantity,
      condition,
      language,
      purchase_price: purchasePrice,
      notes,
    })
    .select("id")
    .single();
  if (collectionError) return { error: collectionError.message };

  if (manualPrice !== null) {
    const { error: priceError } = await salvaPrezzoManualeOggi(admin, collectionRow.id as number, manualPrice);
    if (priceError) return { error: priceError.message };
  }

  revalidatePath("/carte");
  redirect("/carte?added=1");
}

export type ModificaCartaPatch = {
  quantity: number;
  condition: CardCondition;
  language: string;
  purchase_price: number | null;
  manual_price: number | null;
  notes: string | null;
};

export type CarteActionResult = { error?: string };

export async function modificaCarta(id: number, patch: ModificaCartaPatch): Promise<CarteActionResult> {
  await requireUser();

  if (!Number.isFinite(patch.quantity) || patch.quantity <= 0) {
    return { error: "La quantità deve essere un numero positivo." };
  }
  if (patch.purchase_price !== null && (!Number.isFinite(patch.purchase_price) || patch.purchase_price < 0)) {
    return { error: "Il prezzo di acquisto deve essere un numero valido." };
  }
  if (patch.manual_price !== null && (!Number.isFinite(patch.manual_price) || patch.manual_price < 0)) {
    return { error: "Il prezzo attuale manuale deve essere un numero valido." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("my_collection")
    .update({
      quantity: patch.quantity,
      condition: patch.condition,
      language: patch.language,
      purchase_price: patch.purchase_price,
      notes: patch.notes,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  const { error: priceError } = await salvaPrezzoManualeOggi(admin, id, patch.manual_price);
  if (priceError) return { error: priceError.message };

  revalidatePath("/carte");
  return {};
}

export async function aggiornaImmagineCarta(cardId: number, formData: FormData): Promise<CarteActionResult> {
  await requireUser();

  const imageFile = formData.get("image");
  if (!(imageFile instanceof File) || imageFile.size === 0) {
    return { error: "Seleziona un'immagine." };
  }

  const admin = createAdminClient();
  const uploaded = await caricaImmagine(admin, imageFile);
  if ("error" in uploaded) return { error: uploaded.error };

  const { error } = await admin.from("fusion_world_cards").update({ image_url: uploaded.url }).eq("id", cardId);
  if (error) return { error: error.message };

  revalidatePath("/carte");
  return {};
}

export async function getStoricoPrezzo(collectionId: number, idProduct: number | null): Promise<PricePoint[]> {
  await requireUser();
  return getPriceHistory(collectionId, idProduct);
}

export async function eliminaCarta(id: number): Promise<CarteActionResult> {
  await requireUser();

  const admin = createAdminClient();
  const { error } = await admin.from("my_collection").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/carte");
  return {};
}
