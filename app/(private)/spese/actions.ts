"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/dal";

export type AggiungiMovimentoState = { error?: string } | undefined;

export async function aggiungiMovimento(
  _prevState: AggiungiMovimentoState,
  formData: FormData
): Promise<AggiungiMovimentoState> {
  await requireUser();

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
  if (!categoriaId) return { error: "Seleziona una categoria." };

  const admin = createAdminClient();
  const tabella = tipo === "spesa" ? "spese" : "depositi";

  const { error } = await admin.from(tabella).insert({
    importo,
    titolo,
    descrizione,
    categoria_id: categoriaId,
    nominativo,
    dettaglio,
    data,
    fonte: "manuale",
  });
  if (error) return { error: error.message };

  revalidatePath("/spese");
  redirect("/spese?added=1");
}
