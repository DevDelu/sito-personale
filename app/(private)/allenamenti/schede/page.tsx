import type { Metadata } from "next";
import { getSchedeConMeta } from "@/lib/allenamento/queries";
import { SchedeList } from "@/components/allenamento/SchedeList";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SIDEBAR_SECTIONS } from "@/lib/sidebar-config";

const ALLENAMENTO_SEGMENTI = SIDEBAR_SECTIONS.find((s) => s.id === "allenamenti")!.subsections!;

export const metadata: Metadata = { title: "Allenamento · Le mie schede" };

export default async function LeMieSchedePage() {
  const schede = await getSchedeConMeta({ includeArchiviate: true });
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Le mie schede" parent={{ href: "/allenamenti", label: "Allenamento" }} />
      <SegmentedControl items={ALLENAMENTO_SEGMENTI} />
      <SchedeList schede={schede} />
    </div>
  );
}
