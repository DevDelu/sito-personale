"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { SummaryCards } from "@/components/spese/SummaryCards";
import { FilterBar, type Range } from "@/components/spese/FilterBar";
import type { Categoria, Deposito, Spesa } from "@/lib/types";

// Un solo boundary per i tre grafici (non uno a componente): recharts pesa
// ~400KB e deve finire in un unico chunk separato dal bundle principale
// della route, non triplicato. ChartsSkeleton mantiene l'altezza indicativa
// per evitare layout shift durante il caricamento.
const ChartsSection = dynamic(() => import("@/components/spese/ChartsSection").then((m) => m.ChartsSection), {
  ssr: false,
  loading: ChartsSkeleton,
});

function ChartsSkeleton() {
  return (
    <>
      <div className="card h-72 w-full animate-pulse" />
      <div className="card h-72 w-full animate-pulse" />
      <div className="card h-72 w-full animate-pulse" />
    </>
  );
}

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

      <ChartsSection
        spese={spese}
        speseFiltrate={speseFiltrate}
        categorieList={categorieList}
        depositi={depositi}
        range={range}
        onCategoriaCreata={handleCategoriaCreata}
      />
    </div>
  );
}
