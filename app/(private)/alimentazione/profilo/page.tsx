import type { Metadata } from "next";
import { getPesoCorporeo, getProfilo } from "@/lib/alimentazione/queries";
import { Toast } from "@/components/toast";
import { ProfiloForm } from "./profilo-form";
import { PesoForm } from "./peso-form";
import { PesoHistory } from "./peso-history";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SIDEBAR_SECTIONS } from "@/lib/sidebar-config";

const ALIMENTAZIONE_SEGMENTI = SIDEBAR_SECTIONS.find((s) => s.id === "alimentazione")!.subsections!.filter(
  (s) => !s.label.startsWith("+")
);

export const metadata: Metadata = { title: "Alimentazione · Profilo" };

export default async function ProfiloPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; peso_added?: string }>;
}) {
  const { saved, peso_added } = await searchParams;
  const [profilo, pesi] = await Promise.all([getProfilo(), getPesoCorporeo()]);

  return (
    <div className="flex flex-col gap-6">
      {saved && <Toast message="Profilo aggiornato" />}
      {peso_added && <Toast message="Peso registrato" />}

      <PageHeader title="Profilo" parent={{ href: "/alimentazione", label: "Alimentazione" }} />
      <SegmentedControl items={ALIMENTAZIONE_SEGMENTI} />

      <div className="hidden flex-col gap-1 md:flex">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Profilo nutrizionale</h1>
        <p className="text-sm text-muted">Dati usati per calcolare BMR, TDEE e target kcal della fase attiva.</p>
      </div>

      <ProfiloForm profilo={profilo} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-sm font-medium text-muted">Registra peso</h2>
          <PesoForm />
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-sm font-medium text-muted">Storico peso</h2>
          <PesoHistory righe={pesi} />
        </section>
      </div>
    </div>
  );
}
