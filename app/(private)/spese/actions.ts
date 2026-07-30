"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/dal";
import { mondayOf } from "@/lib/csv";

export async function accettaSuggerimento(tabella: "spese" | "depositi", id: string) {
  await requireUser();
  const admin = createAdminClient();
  const tipo = tabella === "spese" ? "spesa" : "entrata";

  const { data: row } = await admin
    .from(tabella)
    .select("categoria_suggerita")
    .eq("id", id)
    .single();

  if (!row?.categoria_suggerita) return;

  const { data: categoria } = await admin
    .from("categorie")
    .select("id")
    .eq("nome", row.categoria_suggerita)
    .eq("tipo", tipo)
    .single();

  if (!categoria) return;

  await admin
    .from(tabella)
    .update({ categoria_id: categoria.id, categoria_suggerita: null })
    .eq("id", id);

  revalidatePath("/spese");
}

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

  if (tipo === "spesa") {
    const { error } = await admin.from("spese").insert({
      importo,
      titolo,
      descrizione,
      categoria_id: categoriaId,
      nominativo,
      dettaglio,
      data,
      settimana_riferimento: mondayOf(data),
      fonte: "manuale",
    });
    if (error) return { error: error.message };
  } else {
    const { error } = await admin.from("depositi").insert({
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
  }

  revalidatePath("/spese");
  redirect("/spese?added=1");
}
