import { AllocationChart } from "@/components/investimenti/AllocationChart";
import { PortfolioHistoryChart } from "@/components/investimenti/PortfolioHistoryChart";
import { PortfolioDateRangeFilter } from "@/components/investimenti/PortfolioDateRangeFilter";
import type { GruppoStorico, PuntoPortafoglio } from "@/lib/investimenti/queries";
import type { Posizione } from "@/lib/investimenti/types";

// Un solo import dinamico per entrambi i grafici (invece di uno a
// componente): recharts va in un unico chunk separato dal bundle principale
// della route, senza duplicarlo due volte.
export function ChartsSection({
  posizioni,
  punti,
  gruppi,
}: {
  posizioni: Posizione[];
  punti: PuntoPortafoglio[];
  gruppi: GruppoStorico[];
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-sm font-medium text-muted">Andamento portafoglio</h2>
          <PortfolioDateRangeFilter />
        </div>
        <PortfolioHistoryChart punti={punti} gruppi={gruppi} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-medium text-muted">Allocazione per tipo</h2>
        <AllocationChart posizioni={posizioni} />
      </section>
    </div>
  );
}
