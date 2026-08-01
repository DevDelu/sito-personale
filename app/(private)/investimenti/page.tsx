import { getPortfolioSnapshots, getPosizioniCorrenti, getTransazioni } from "@/lib/investimenti/queries";
import { SummaryCards } from "@/components/investimenti/SummaryCards";
import { AllocationChart } from "@/components/investimenti/AllocationChart";
import { PortfolioHistoryChart } from "@/components/investimenti/PortfolioHistoryChart";
import { PositionsTable } from "@/components/investimenti/PositionsTable";

export default async function InvestimentiPage() {
  const [posizioni, snapshots, transazioni] = await Promise.all([
    getPosizioniCorrenti(),
    getPortfolioSnapshots(),
    getTransazioni(),
  ]);

  const totaleInvestito = posizioni.reduce((s, p) => s + p.costoTotaleCarico, 0);
  const valoreAttuale = posizioni.reduce((s, p) => s + (p.valoreAttuale ?? 0), 0);

  const posizioniConGain = posizioni.filter((p) => p.plusvalenzaAssoluta !== null);
  const plusvalenzaAssoluta =
    posizioniConGain.length > 0 ? posizioniConGain.reduce((s, p) => s + (p.plusvalenzaAssoluta ?? 0), 0) : null;
  const costoNotoTotale = posizioniConGain.reduce((s, p) => s + p.costoTotaleCarico, 0);
  const plusvalenzaPercentuale =
    plusvalenzaAssoluta !== null && costoNotoTotale > 0 ? (plusvalenzaAssoluta / costoNotoTotale) * 100 : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Investimenti</h1>
        <p className="text-sm text-muted">Posizioni correnti, calcolate con il metodo FIFO.</p>
      </div>

      <SummaryCards
        totaleInvestito={totaleInvestito}
        valoreAttuale={valoreAttuale}
        plusvalenzaAssoluta={plusvalenzaAssoluta}
        plusvalenzaPercentuale={plusvalenzaPercentuale}
      />

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

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-medium text-muted">Posizioni</h2>
        <PositionsTable posizioni={posizioni} transazioni={transazioni} />
      </section>
    </div>
  );
}
