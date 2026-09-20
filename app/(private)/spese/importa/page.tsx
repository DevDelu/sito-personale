import type { Metadata } from "next";
import { getCategorie } from "@/lib/spese/queries";
import { ImportForm } from "./import-form";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SIDEBAR_SECTIONS } from "@/lib/sidebar-config";

export const metadata: Metadata = { title: "Spese · Importa" };

const SPESE_SEGMENTI = SIDEBAR_SECTIONS.find((s) => s.id === "spese")!.subsections!.filter(
  (s) => !s.label.startsWith("+")
);

export default async function ImportaPage() {
  const categorie = await getCategorie();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Importa" parent={{ href: "/spese", label: "Spese" }} />
      <SegmentedControl items={SPESE_SEGMENTI} />

      <div className="hidden flex-col gap-1 md:flex">
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
