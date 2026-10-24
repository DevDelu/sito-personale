"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWriter } from "@/lib/supabase/dal";
import { risolviCategoriaId } from "@/lib/spese/categoria-default";

export type AggiungiMovimentoState = { error?: string } | undefined;

export async function aggiungiMovimento(
  _prevState: AggiungiMovimentoState,
  formData: FormData
): Promise<AggiungiMovimentoState> {
  await requireWriter();

  const tipo = formData.get("tipo") === "entrata" ? "entrata" : "spesa";
  const titolo = String(formData.get("titolo") ?? "").trim();
  const importoRaw = String(formData.get("importo") ?? "").replace(",", ".");
  const importo = Number(importoRaw);
  const data = String(formData.get("data") ?? "").trim();
  const categoriaId = String(formData.get("categoria_id") ?? "").trim();
  const descrizione = String(formData.get("descrizione") ?? "").trim() || null;
  const nominativo = String(formData.get("nominativo") ?? "").trim() || null;
  const dettaglio = String(formData.get("dettaglio") ?? "").trim() || null;

  if (!titolo) return { error: "Il titolo è obbligatorio." };
  if (!Number.isFinite(importo) || importo <= 0) {
    return { error: "L'importo deve essere un numero positivo." };
  }
  if (!data) return { error: "La data è obbligatoria." };

  const admin = createAdminClient();
  let categoriaFinale = categoriaId;
  if (!categoriaFinale) {
    const { data: categorie, error: errCat } = await admin
      .from("categorie")
      .select("id, nome, tipo");
    if (errCat) return { error: errCat.message };
    const trovata = risolviCategoriaId("", categorie ?? [], tipo);
    if (!trovata) return { error: 'Manca la categoria "Altro": creala o scegline una.' };
    categoriaFinale = trovata;
  }
  const tabella = tipo === "spesa" ? "spese" : "depositi";

  const { error } = await admin.from(tabella).insert({
    importo,
    titolo,
    descrizione,
    categoria_id: categoriaFinale,
    nominativo,
    dettaglio,
    data,
    fonte: "manuale",
  });
  if (error) return { error: error.message };

  revalidatePath("/spese");
  redirect("/spese?added=1");
}
