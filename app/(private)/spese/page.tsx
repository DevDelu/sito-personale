import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { getOverviewData } from "@/lib/spese/queries";
import { Overview } from "./overview";
import { Toast } from "@/components/toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { FAB } from "@/components/ui/FAB";
import { SIDEBAR_SECTIONS } from "@/lib/sidebar-config";

// Le voci Overview/Gestione/Importa del segmented control mobile vengono da
// qui, senza duplicare le etichette: "+ Aggiungi" diventa il FAB in basso a
// destra invece che una quarta voce.
const SPESE_SEGMENTI = SIDEBAR_SECTIONS.find((s) => s.id === "spese")!.subsections!.filter(
  (s) => !s.label.startsWith("+")
);

export const metadata: Metadata = { title: "Spese" };

const DEFAULT_PRESET = "mese";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function firstOfMonthIso(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1)).toISOString().slice(0, 10);
}

function presetRange(preset: string): { from: string; to: string } {
  if (preset === "7") return { from: daysAgoIso(7), to: todayIso() };
  return { from: firstOfMonthIso(), to: todayIso() };
}

export default async function SpesePage({
  searchParams,
}: {
  searchParams: Promise<{ added?: string; preset?: string; from?: string; to?: string }>;
}) {
  const { added, preset, from, to } = await searchParams;

  const range =
    from && to
      ? { from, to, preset: null }
      : { ...presetRange(preset ?? DEFAULT_PRESET), preset: preset ?? DEFAULT_PRESET };

  const { spese, categorie, depositi } = await getOverviewData(range.from, range.to);

  return (
    <div className="flex flex-col gap-6">
      {added && <Toast message="Movimento aggiunto" />}

      <PageHeader title="Spese" />
      <SegmentedControl items={SPESE_SEGMENTI} />

      <div className="hidden flex-col gap-1 md:flex">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Spese ed entrate</h1>
        <p className="text-sm text-muted">Panoramica di entrate, uscite e categorie di spesa.</p>
      </div>

      <Overview spese={spese} categorie={categorie} depositi={depositi} range={range} />

      <FAB href="/spese/nuovo" label="Aggiungi movimento" icon={<Plus className="h-6 w-6" strokeWidth={2.25} />} />
    </div>
  );
}
