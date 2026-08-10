import type { Metadata } from "next";
import { getCategorie } from "@/lib/spese/queries";
import { ImportForm } from "./import-form";

export const metadata: Metadata = { title: "Spese · Importa" };

export default async function ImportaPage() {
  const categorie = await getCategorie();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-xl font-semibold tracking-tight">Importa</h1>
        <p className="text-sm text-muted">
          Carica l&apos;Excel già categorizzato, oppure i CSV/XLSX grezzi di Crypto.com e Intesa
          Sanpaolo per una categorizzazione automatica.
        </p>
      </div>
      <ImportForm categorie={categorie} />
    </div>
  );
}
