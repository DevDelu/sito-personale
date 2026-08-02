import { getCollectionOverview } from "@/lib/carte/queries";
import { formatCurrency } from "@/lib/carte/format";
import { MetricCard } from "@/components/ui/MetricCard";
import { HeroCards } from "@/components/carte/HeroCards";
import { AltreCarteList } from "@/components/carte/AltreCarteList";

export default async function CartePage() {
  const { hero, resto, valoreTotale, numeroCarte } = await getCollectionOverview();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Collezione carte</h1>
        <p className="text-sm text-muted">Dragon Ball Super — Fusion World, prezzi da Cardmarket.</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-medium text-muted">Le tue carte di valore</h2>
        <HeroCards carte={hero} />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MetricCard
          label="Valore totale"
          value={formatCurrency(valoreTotale)}
          colorVar="--accent"
          note={`${numeroCarte} carte, prezzo attuale (trend) — incluse quelle sotto`}
        />
        <MetricCard label="Numero carte" value={String(numeroCarte)} colorVar="--invest-stock" />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-medium text-muted">Altre carte</h2>
        <AltreCarteList carte={resto} />
      </section>
    </div>
  );
}
