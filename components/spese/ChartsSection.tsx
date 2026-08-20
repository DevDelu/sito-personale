import { DailyTrendChart } from "@/components/spese/DailyTrendChart";
import { CategorySpendingTrendChart } from "@/components/spese/CategorySpendingTrendChart";
import { CategoryPieChart } from "@/components/spese/CategoryPieChart";
import type { Categoria, Deposito, Spesa } from "@/lib/types";
import type { Range } from "@/components/spese/FilterBar";

// Un solo import dinamico per tutti e tre i grafici (invece di uno a
// componente): recharts va in un unico chunk separato dal bundle principale
// della route, senza duplicarlo tre volte.
export function ChartsSection({
  spese,
  categorieList,
  depositi,
  range,
  onCategoriaCreata,
}: {
  spese: Spesa[];
  categorieList: Categoria[];
  depositi: Deposito[];
  range: Range;
  onCategoriaCreata: (nuova: Categoria) => void;
}) {
  return (
    <>
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-medium text-muted">Andamento giornaliero</h2>
        <DailyTrendChart
          spese={spese}
          depositi={depositi}
          from={range.from}
          to={range.to}
          categorie={categorieList}
          onCategoriaCreata={onCategoriaCreata}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-medium text-muted">Andamento per categoria</h2>
        <CategorySpendingTrendChart spese={spese} from={range.from} to={range.to} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-medium text-muted">Movimenti per categoria</h2>
        <CategoryPieChart
          spese={spese}
          depositi={depositi}
          categorie={categorieList}
          range={range}
          onCategoriaCreata={onCategoriaCreata}
        />
      </section>
    </>
  );
}
