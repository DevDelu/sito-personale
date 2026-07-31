"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SummaryCards } from "@/components/spese/SummaryCards";
import { FilterBar, type Range } from "@/components/spese/FilterBar";
import { DailyTrendChart } from "@/components/spese/DailyTrendChart";
import { CategoryPieChart } from "@/components/spese/CategoryPieChart";
import type { Categoria, Deposito, Spesa } from "@/lib/types";

export function Overview({
  spese,
  categorie,
  depositi,
  range,
}: {
  spese: Spesa[];
  categorie: Categoria[];
  depositi: Deposito[];
  range: Range;
}) {
  const [categoriaFiltro, setCategoriaFiltro] = useState("tutte");
  const [categorieList, setCategorieList] = useState(categorie);
  const [prevCategorie, setPrevCategorie] = useState(categorie);

  // Risincronizza con il server ad ogni router.refresh() (es. dopo un
  // salvataggio/eliminazione dal popup di dettaglio), mantenendo però le
  // categorie create localmente nel frattempo. Pattern "adjusting state when
  // a prop changes" (react.dev/learn/you-might-not-need-an-effect).
  if (categorie !== prevCategorie) {
    setPrevCategorie(categorie);
    setCategorieList(categorie);
  }

  function handleCategoriaCreata(nuova: Categoria) {
    setCategorieList((prev) =>
      prev.some((c) => c.id === nuova.id)
        ? prev
        : [...prev, nuova].sort((a, b) => a.nome.localeCompare(b.nome))
    );
  }

  const categorieSpesa = useMemo(() => categorieList.filter((c) => c.tipo === "spesa"), [categorieList]);

  const speseFiltrate = useMemo(
    () =>
      categoriaFiltro === "tutte"
        ? spese
        : spese.filter((s) => s.categoria_nome === categoriaFiltro),
    [spese, categoriaFiltro]
  );

  const totaleSpese = useMemo(() => speseFiltrate.reduce((s, r) => s + r.importo, 0), [speseFiltrate]);
  const totaleEntrate = useMemo(() => depositi.reduce((s, r) => s + r.importo, 0), [depositi]);

  return (
    <div className="flex flex-col gap-8">
      <FilterBar
        range={range}
        categorie={categorieSpesa}
        categoriaSelezionata={categoriaFiltro}
        onCategoriaChange={setCategoriaFiltro}
      />

      <SummaryCards entrate={totaleEntrate} uscite={totaleSpese} />

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-medium text-muted">Andamento giornaliero</h2>
        <DailyTrendChart
          spese={speseFiltrate}
          depositi={depositi}
          from={range.from}
          to={range.to}
          categorie={categorieList}
          onCategoriaCreata={handleCategoriaCreata}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-medium text-muted">Spese per categoria</h2>
        <CategoryPieChart
          spese={speseFiltrate}
          categorie={categorieList}
          range={range}
          onCategoriaCreata={handleCategoriaCreata}
        />
      </section>

      <Link
        href="/spese/gestione"
        className="self-start text-sm font-medium text-accent transition-opacity hover:opacity-80"
      >
        Vedi tutte le spese →
      </Link>
    </div>
  );
}
