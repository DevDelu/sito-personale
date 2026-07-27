import { getDashboardData } from "@/lib/supabase/queries";
import { SpeseDashboard } from "./spese-dashboard";

export default async function SpesePage() {
  const { spese, categorie, depositi } = await getDashboardData();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Spese</h1>
      <SpeseDashboard spese={spese} categorie={categorie} depositi={depositi} />
    </div>
  );
}
