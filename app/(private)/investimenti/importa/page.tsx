import type { Metadata } from "next";
import { ImportForm } from "@/components/investimenti/ImportForm";

export const metadata: Metadata = { title: "Investimenti · Importa" };

export default function InvestimentiImportaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Importa transazioni</h1>
        <p className="text-sm text-muted">Carica un file Excel con le transazioni da aggiungere.</p>
      </div>
      <ImportForm />
    </div>
  );
}
