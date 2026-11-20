import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ResocontiElenco } from "@/components/novita/ResocontiElenco";
import { listaResoconti } from "@/lib/novita/queries";
import { SIDEBAR_SECTIONS } from "@/lib/sidebar-config";

export const metadata: Metadata = { title: "Resoconti" };

// Resoconti di fine turno del team di agenti (prima arrivavano via email).
export default async function ResocontiPage() {
  const resoconti = await listaResoconti();
  const sotto = SIDEBAR_SECTIONS.find((s) => s.id === "novita")?.subsections ?? [];
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Resoconti" parent={{ href: "/altro", label: "Altro" }} />
      <SegmentedControl items={sotto} />
      <div className="hidden flex-col gap-1 md:flex">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Resoconti del team</h1>
        <p className="text-sm text-muted">Cosa hanno fatto gli agenti in ogni turno e cosa aspetta te.</p>
      </div>
      <div data-fb-area="novita.resoconti" className="contents">
        <ResocontiElenco resoconti={resoconti} />
      </div>
    </div>
  );
}
