import type { Metadata } from "next";
import { getSessioni, getUltimeSessioniConLog } from "@/lib/allenamento/queries";
import { SessionsHistoryTable } from "@/components/allenamento/SessionsHistoryTable";
import { ProgressTable } from "@/components/allenamento/ProgressTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SIDEBAR_SECTIONS } from "@/lib/sidebar-config";

const ALLENAMENTO_SEGMENTI = SIDEBAR_SECTIONS.find((s) => s.id === "allenamenti")!.subsections!;

export const metadata: Metadata = { title: "Allenamento · Storico" };

export default async function StoricoAllenamentoPage() {
  const [sessioni, progressi] = await Promise.all([getSessioni(), getUltimeSessioniConLog(30)]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Storico" parent={{ href: "/allenamenti", label: "Allenamento" }} />
      <SegmentedControl items={ALLENAMENTO_SEGMENTI} />

      <div className="hidden flex-col gap-1 md:flex">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Storico</h1>
        <p className="text-sm text-muted">{sessioni.length} sessioni registrate.</p>
      </div>

      <SessionsHistoryTable sessioni={sessioni} />

      <ProgressTable sessioni={progressi.sessioni} log={progressi.log} />
    </div>
  );
}
