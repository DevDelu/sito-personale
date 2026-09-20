import type { Metadata } from "next";
import { getCategorie } from "@/lib/spese/queries";
import { AddTransactionForm } from "./add-transaction-form";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Spese · Nuovo movimento" };

const FORM_ID = "nuovo-movimento-form";

export default async function NuovoMovimentoPage() {
  const categorie = await getCategorie();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nuovo movimento"
        parent={{ href: "/spese", label: "Spese" }}
        action={
          <button type="submit" form={FORM_ID} className="text-[17px] font-semibold text-accent active:opacity-60">
            Salva
          </button>
        }
      />
      <h1 className="hidden font-display text-xl font-semibold tracking-tight md:block">
        Aggiungi movimento
      </h1>
      <AddTransactionForm categorie={categorie} formId={FORM_ID} />
    </div>
  );
}
