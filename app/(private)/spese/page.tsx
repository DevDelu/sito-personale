import { getOverviewData } from "@/lib/spese/queries";
import { Overview } from "./overview";
import { Toast } from "@/components/toast";

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
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Spese ed entrate</h1>
        <p className="text-sm text-muted">Panoramica di entrate, uscite e categorie di spesa.</p>
      </div>
      <Overview spese={spese} categorie={categorie} depositi={depositi} range={range} />
    </div>
  );
}
