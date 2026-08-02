import { AllocationChart } from "@/components/investimenti/AllocationChart";
import { PortfolioHistoryChart } from "@/components/investimenti/PortfolioHistoryChart";
import type { Posizione } from "@/lib/investimenti/types";

// Un solo import dinamico per entrambi i grafici (invece di uno a
// componente): recharts va in un unico chunk separato dal bundle principale
// della route, senza duplicarlo due volte.
export function ChartsSection({
  posizioni,
  snapshots,
}: {
  posizioni: Posizione[];
  snapshots: { data: string; valore_totale: number }[];
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-medium text-muted">Andamento portafoglio</h2>
        <PortfolioHistoryChart snapshots={snapshots} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-medium text-muted">Allocazione per tipo</h2>
        <AllocationChart posizioni={posizioni} />
      </section>
    </div>
  );
}
