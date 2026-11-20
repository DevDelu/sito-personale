import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SIDEBAR_SECTIONS } from "@/lib/sidebar-config";
import { Ripasso } from "@/components/trading/Ripasso";

export const metadata: Metadata = { title: "Ripasso" };

const SEGMENTI = SIDEBAR_SECTIONS.find((s) => s.id === "trading")!.subsections!;

export default function RipassoPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <PageHeader title="Ripasso" parent={{ href: "/trading", label: "Corso" }} />
      <SegmentedControl items={SEGMENTI} />

      <div className="hidden flex-col gap-1 md:flex">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Ripasso</h1>
        <p className="text-sm text-muted">10 domande miste da tutto il corso o da un modulo: il modo più rapido per fissare i concetti.</p>
      </div>
      <p className="text-[15px] text-muted md:hidden">10 domande miste da tutto il corso o da un modulo.</p>

      <div data-fb-area="trading.ripasso.quiz" className="contents">
        <section className="card flex flex-col gap-4 p-5">
          <Ripasso />
        </section>
      </div>
    </div>
  );
}
