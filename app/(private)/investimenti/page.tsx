import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { getPortfolioHistoryByAsset, getPosizioniCorrenti, getTransazioni } from "@/lib/investimenti/queries";
import { SummaryCards } from "@/components/investimenti/SummaryCards";
import { PositionsTable } from "@/components/investimenti/PositionsTable";

export const metadata: Metadata = { title: "Investimenti" };

// Un solo import dinamico per entrambi i grafici: recharts (~400KB) finisce
// in un unico chunk separato dal bundle principale della route, invece di
// duplicarsi per componente. Resta SSR (niente ssr:false, non supportato
// nei Server Component).
const ChartsSection = dynamic(() => import("@/components/investimenti/ChartsSection").then((m) => m.ChartsSection));

export default async function InvestimentiPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;

  const [posizioni, storico, transazioni] = await Promise.all([
    getPosizioniCorrenti(),
    getPortfolioHistoryByAsset(from, to),
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

      <ChartsSection posizioni={posizioni} punti={storico.punti} gruppi={storico.gruppi} />

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-medium text-muted">Posizioni</h2>
        <PositionsTable posizioni={posizioni} transazioni={transazioni} />
      </section>
    </div>
  );
}
