import { getDashboardData } from "@/lib/supabase/queries";
import { SpeseDashboard } from "./spese-dashboard";

export default async function SpesePage() {
  const { spese, categorie, depositi } = await getDashboardData();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Spese ed entrate</h1>
        <p className="text-sm text-muted">Panoramica di entrate, uscite e categorie di spesa.</p>
      </div>
      <SpeseDashboard spese={spese} categorie={categorie} depositi={depositi} />
    </div>
  );
}
