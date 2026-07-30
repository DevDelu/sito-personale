"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Categoria } from "@/lib/types";

export function GestioneFilters({ categorie }: { categorie: Categoria[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cerca per titolo o descrizione..."
        className="w-56 rounded-xl border border-border bg-surface px-3 py-1.5 text-sm text-foreground outline-none focus:border-accent"
      />
      <select
        defaultValue={searchParams.get("tipo") ?? ""}
        onChange={(e) => setParam("tipo", e.target.value)}
        className="rounded-xl border border-border bg-surface px-3 py-1.5 text-sm text-foreground"
      >
        <option value="">Tutti i tipi</option>
        <option value="spesa">Spese</option>
        <option value="entrata">Entrate</option>
      </select>
      <select
        defaultValue={searchParams.get("categoria") ?? ""}
        onChange={(e) => setParam("categoria", e.target.value)}
        className="rounded-xl border border-border bg-surface px-3 py-1.5 text-sm text-foreground"
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
        defaultValue={searchParams.get("from") ?? ""}
        onChange={(e) => setParam("from", e.target.value)}
        className="rounded-xl border border-border bg-surface px-2 py-1.5 text-sm text-foreground"
      />
      <span className="text-muted">–</span>
      <input
        type="date"
        defaultValue={searchParams.get("to") ?? ""}
        onChange={(e) => setParam("to", e.target.value)}
        className="rounded-xl border border-border bg-surface px-2 py-1.5 text-sm text-foreground"
      />
    </div>
  );
}
