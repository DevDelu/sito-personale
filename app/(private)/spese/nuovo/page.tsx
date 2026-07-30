import { createAdminClient } from "@/lib/supabase/admin";
import { AddTransactionForm } from "./add-transaction-form";
import type { Categoria } from "@/lib/types";

export default async function NuovoMovimentoPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("categorie")
    .select("id, nome, colore, tipo")
    .order("nome");

  const categorie = (data ?? []) as Categoria[];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Aggiungi movimento</h1>
      <AddTransactionForm categorie={categorie} />
    </div>
  );
}
