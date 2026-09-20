"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import type { Categoria } from "@/lib/types";

export function GestioneFilters({ categorie }: { categorie: Categoria[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [filtriAperti, setFiltriAperti] = useState(false);

  function setParam(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    params.delete("page");
    router.push(`/spese/gestione?${params.toString()}`);
  }

  useEffect(() => {
    const current = searchParams.get("search") ?? "";
    if (search === current) return;
    const timer = setTimeout(() => setParam("search", search), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const tipo = searchParams.get("tipo") ?? "";
  const categoria = searchParams.get("categoria") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const filtriAttivi = [tipo, categoria, from, to].filter(Boolean).length;

  return (
    <>
      {/* Mobile: campo di ricerca sempre visibile, gli altri filtri in uno
          sheet dietro un pulsante con badge quando attivi. Da md in su resta
          la barra unica con tutti i filtri inline. */}
      <div className="flex items-center gap-2 md:hidden">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca per titolo o descrizione..."
          className="field-input flex-1 bg-surface"
        />
        <button
          type="button"
          onClick={() => setFiltriAperti(true)}
          aria-label="Filtri"
          className="btn-icon relative border border-border !p-2.5"
        >
          <SlidersHorizontal className="h-5 w-5" />
          {filtriAttivi > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
              {filtriAttivi}
            </span>
          )}
        </button>
      </div>

      {filtriAperti && (
        <Sheet onClose={() => setFiltriAperti(false)} className="max-w-md p-5">
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-base font-semibold">Filtri</h2>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted">Tipo</span>
              <select
                defaultValue={tipo}
                onChange={(e) => setParam("tipo", e.target.value)}
                className="field-input"
              >
                <option value="">Tutti i tipi</option>
                <option value="spesa">Spese</option>
                <option value="entrata">Entrate</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted">Categoria</span>
              <select
                defaultValue={categoria}
                onChange={(e) => setParam("categoria", e.target.value)}
                className="field-input"
              >
                <option value="">Tutte le categorie</option>
                {categorie.map((c) => (
                  <option key={c.id} value={c.nome}>
                    {c.nome} ({c.tipo})
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-2">
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="text-sm font-medium text-muted">Da</span>
                <input
                  type="date"
                  defaultValue={from}
                  onChange={(e) => setParam("from", e.target.value)}
                  className="field-input"
                />
              </label>
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="text-sm font-medium text-muted">A</span>
                <input
                  type="date"
                  defaultValue={to}
                  onChange={(e) => setParam("to", e.target.value)}
                  className="field-input"
                />
              </label>
            </div>

            <button type="button" onClick={() => setFiltriAperti(false)} className="btn-primary">
              Applica
            </button>
          </div>
        </Sheet>
      )}

      <div className="hidden flex-wrap items-center gap-2 md:flex">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca per titolo o descrizione..."
          className="field-input w-full bg-surface px-3 py-1.5 text-sm sm:w-56"
        />
        <select
          defaultValue={tipo}
          onChange={(e) => setParam("tipo", e.target.value)}
          className="field-input bg-surface px-3 py-1.5 text-sm"
        >
          <option value="">Tutti i tipi</option>
          <option value="spesa">Spese</option>
          <option value="entrata">Entrate</option>
        </select>
        <select
          defaultValue={categoria}
          onChange={(e) => setParam("categoria", e.target.value)}
          className="field-input bg-surface px-3 py-1.5 text-sm"
        >
          <option value="">Tutte le categorie</option>
          {categorie.map((c) => (
            <option key={c.id} value={c.nome}>
              {c.nome} ({c.tipo})
            </option>
          ))}
        </select>
        <input
          type="date"
          defaultValue={from}
          onChange={(e) => setParam("from", e.target.value)}
          className="field-input bg-surface px-2 py-1.5 text-sm"
        />
        <span className="text-muted">–</span>
        <input
          type="date"
          defaultValue={to}
          onChange={(e) => setParam("to", e.target.value)}
          className="field-input bg-surface px-2 py-1.5 text-sm"
        />
      </div>
    </>
  );
}
