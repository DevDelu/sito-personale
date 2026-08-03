import type { Metadata } from "next";
import { getCollectionOverview } from "@/lib/carte/queries";
import { formatCurrency } from "@/lib/carte/format";
import { MetricCard } from "@/components/ui/MetricCard";
import { CollectionSections } from "@/components/carte/CollectionSections";

export const metadata: Metadata = { title: "Carte" };

export default async function CartePage() {
  const { hero, resto, valoreTotale, numeroCarte } = await getCollectionOverview();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Collezione carte</h1>
        <p className="text-sm text-muted">Dragon Ball Super — Fusion World, prezzi da Cardmarket.</p>
      </div>

      <CollectionSections
        hero={hero}
        resto={resto}
        metricsSlot={
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MetricCard label="Valore totale" value={formatCurrency(valoreTotale)} colorVar="--accent" />
            <MetricCard label="Numero carte" value={String(numeroCarte)} colorVar="--invest-stock" />
          </section>
        }
      />
    </div>
  );
}
