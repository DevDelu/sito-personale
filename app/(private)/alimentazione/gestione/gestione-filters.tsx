"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function GestioneFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    params.delete("page");
    router.push(`/alimentazione/gestione?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="Tipo di pasto"
        defaultValue={searchParams.get("tipo") ?? ""}
        onChange={(e) => setParam("tipo", e.target.value)}
        className="field-input bg-surface px-3 py-1.5 text-sm"
      >
        <option value="">Tutti i tipi</option>
        <option value="colazione">Colazione</option>
        <option value="pranzo">Pranzo</option>
        <option value="cena">Cena</option>
        <option value="spuntino">Spuntino</option>
      </select>
      <input
        type="date"
        aria-label="Dal giorno"
        defaultValue={searchParams.get("from") ?? ""}
        onChange={(e) => setParam("from", e.target.value)}
        className="field-input bg-surface px-2 py-1.5 text-sm"
      />
      <span className="text-muted">–</span>
      <input
        type="date"
        aria-label="Al giorno"
        defaultValue={searchParams.get("to") ?? ""}
        onChange={(e) => setParam("to", e.target.value)}
        className="field-input bg-surface px-2 py-1.5 text-sm"
      />
    </div>
  );
}
