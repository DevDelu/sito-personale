import { getDashboardData } from "@/lib/supabase/queries";
import { SpeseDashboard } from "./spese-dashboard";
import { Toast } from "@/components/toast";

const PRESET_DAYS: Record<string, number> = { "7": 7, "30": 30, "90": 90 };
const DEFAULT_PRESET = "30";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
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
      : {
          from: daysAgoIso(PRESET_DAYS[preset ?? ""] ?? PRESET_DAYS[DEFAULT_PRESET]),
          to: todayIso(),
          preset: preset && PRESET_DAYS[preset] ? preset : DEFAULT_PRESET,
        };

  const { spese, categorie, depositi } = await getDashboardData(range.from, range.to);

  return (
    <div className="flex flex-col gap-6">
      {added && <Toast message="Movimento aggiunto" />}
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Spese ed entrate</h1>
        <p className="text-sm text-muted">Panoramica di entrate, uscite e categorie di spesa.</p>
      </div>
      <SpeseDashboard spese={spese} categorie={categorie} depositi={depositi} range={range} />
    </div>
  );
}
