import type { Metadata } from "next";
import { ImportForm } from "@/components/investimenti/ImportForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SIDEBAR_SECTIONS } from "@/lib/sidebar-config";

const INVESTIMENTI_SEGMENTI = SIDEBAR_SECTIONS.find((s) => s.id === "investimenti")!.subsections!;

export const metadata: Metadata = { title: "Investimenti · Importa" };

export default function InvestimentiImportaPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Importa" parent={{ href: "/investimenti", label: "Investimenti" }} />
      <SegmentedControl items={INVESTIMENTI_SEGMENTI} />

      <div className="hidden flex-col gap-1 md:flex">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Importa transazioni</h1>
        <p className="text-sm text-muted">Carica un file Excel con le transazioni da aggiungere.</p>
      </div>
      <ImportForm />
    </div>
  );
}
