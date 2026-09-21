import type { Metadata } from "next";
import { getAlimenti } from "@/lib/alimentazione/queries";
import { getTemplatePasti } from "@/lib/alimentazione/template";
import { TemplateGrid } from "@/components/alimentazione/TemplateGrid";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SIDEBAR_SECTIONS } from "@/lib/sidebar-config";

const ALIMENTAZIONE_SEGMENTI = SIDEBAR_SECTIONS.find((s) => s.id === "alimentazione")!.subsections!.filter(
  (s) => !s.label.startsWith("+")
);

export const metadata: Metadata = { title: "Alimentazione · Template settimanale" };

export default async function TemplateSettimanalePage() {
  const [templates, alimenti] = await Promise.all([getTemplatePasti(), getAlimenti()]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Template" parent={{ href: "/alimentazione", label: "Alimentazione" }} />
      <SegmentedControl items={ALIMENTAZIONE_SEGMENTI} />

      <div className="hidden flex-col gap-1 md:flex">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Template settimanale</h1>
        <p className="text-sm text-muted">
          Una cella per ogni giorno × tipo pasto. Clicca una cella per impostare nome e composizione (alimento +
          grammi). Le quantità seminate sono placeholder di partenza: correggile qui in base al piano reale.
        </p>
      </div>

      <TemplateGrid templates={templates} alimenti={alimenti} />
    </div>
  );
}
