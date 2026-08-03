import type { Metadata } from "next";
import { getCategorie } from "@/lib/spese/queries";
import { AddTransactionForm } from "./add-transaction-form";

export const metadata: Metadata = { title: "Spese · Nuovo movimento" };

export default async function NuovoMovimentoPage() {
  const categorie = await getCategorie();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl font-semibold tracking-tight">Aggiungi movimento</h1>
      <AddTransactionForm categorie={categorie} />
    </div>
  );
}
