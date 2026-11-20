import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SIDEBAR_SECTIONS } from "@/lib/sidebar-config";
import { Glossario } from "@/components/trading/Glossario";

export const metadata: Metadata = { title: "Glossario dei mercati" };

const SEGMENTI = SIDEBAR_SECTIONS.find((s) => s.id === "trading")!.subsections!;

export default function GlossarioPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <PageHeader title="Glossario" parent={{ href: "/trading", label: "Corso" }} />
      <SegmentedControl items={SEGMENTI} />

      <div className="hidden flex-col gap-1 md:flex">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Glossario</h1>
        <p className="text-sm text-muted">I termini di notizie, commenti TV e discussioni, con il link alla lezione.</p>
      </div>

      <div data-fb-area="trading.glossario.elenco" className="contents">
        <Glossario />
      </div>
    </div>
  );
}
