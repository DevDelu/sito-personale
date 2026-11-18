import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type EsitoBozza =
  | { ok: true; stato: "confermata" | "annullata"; titolo: string }
  | { ok: false; motivo: "gia-gestita" };

// Il passaggio in_attesa → confermata/annullata è un UPDATE condizionato:
// un doppio tap (o un retry di Telegram) trova la riga già gestita e non
// inserisce il movimento due volte.
export async function chiudiBozza(id: string, azione: "conferma" | "annulla"): Promise<EsitoBozza> {
  const admin = createAdminClient();
  const { data: bozza, error } = await admin
    .from("telegram_bozze")
    .update({ stato: azione === "conferma" ? "confermata" : "annullata" })
    .eq("id", id)
    .eq("stato", "in_attesa")
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!bozza) return { ok: false, motivo: "gia-gestita" };
  if (azione === "annulla") return { ok: true, stato: "annullata", titolo: bozza.titolo };

  const tabella = bozza.tipo === "spesa" ? "spese" : "depositi";
  const { data: mov, error: errIns } = await admin
    .from(tabella)
    .insert({
      importo: bozza.importo,
      titolo: bozza.titolo,
      descrizione: bozza.descrizione,
      categoria_id: bozza.categoria_id,
      data: bozza.data,
      fonte: "telegram",
    })
    .select("id")
    .single();
  if (errIns) {
    // Rimette la bozza in attesa: Lorenzo può ritoccare Conferma.
    await admin.from("telegram_bozze").update({ stato: "in_attesa" }).eq("id", id);
    throw new Error(errIns.message);
  }
  await admin.from("telegram_bozze").update({ movimento_id: mov.id }).eq("id", id);
  revalidatePath("/spese");
  return { ok: true, stato: "confermata", titolo: bozza.titolo };
}

// true se l'update è nuovo, false se Telegram lo sta ripetendo.
export async function segnaUpdate(updateId: number): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("telegram_update_visti").insert({ update_id: updateId });
  if (!error) return true;
  if (error.code === "23505") return false; // unique_violation: già visto
  throw new Error(error.message);
}
