import { getDashboardData } from "@/lib/supabase/queries";
import { SpeseDashboard } from "./spese-dashboard";
import { Toast } from "@/components/toast";

export default async function SpesePage({
  searchParams,
}: {
  searchParams: Promise<{ added?: string }>;
}) {
  const { spese, categorie, depositi } = await getDashboardData();
  const { added } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      {added && <Toast message="Movimento aggiunto" />}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Spese ed entrate</h1>
        <p className="text-sm text-muted">Panoramica di entrate, uscite e categorie di spesa.</p>
      </div>
      <SpeseDashboard spese={spese} categorie={categorie} depositi={depositi} />
    </div>
  );
}
