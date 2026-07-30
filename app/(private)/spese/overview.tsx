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
  saldoAllTime,
}: {
  spese: Spesa[];
  categorie: Categoria[];
  depositi: Deposito[];
  range: Range;
  saldoAllTime: number;
}) {
  const [categoriaFiltro, setCategoriaFiltro] = useState("tutte");

  const categorieSpesa = useMemo(() => categorie.filter((c) => c.tipo === "spesa"), [categorie]);

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

      <SummaryCards entrate={totaleEntrate} uscite={totaleSpese} saldoAllTime={saldoAllTime} />

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-medium text-muted">Andamento giornaliero</h2>
        <DailyTrendChart spese={speseFiltrate} depositi={depositi} from={range.from} to={range.to} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-medium text-muted">Spese per categoria</h2>
        <CategoryPieChart spese={speseFiltrate} />
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
