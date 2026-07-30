"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Categoria } from "@/lib/types";

const PRESETS = [
  { id: "7", label: "7 giorni" },
  { id: "30", label: "30 giorni" },
  { id: "mese", label: "Mese corrente" },
] as const;

export type Range = { from: string; to: string; preset: string | null };

export function FilterBar({
  range,
  categorie,
  categoriaSelezionata,
  onCategoriaChange,
}: {
  range: Range;
  categorie: Categoria[];
  categoriaSelezionata: string;
  onCategoriaChange: (v: string) => void;
}) {
  const router = useRouter();
  const [showCustom, setShowCustom] = useState(range.preset === null);
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setShowCustom(false);
              router.push(`/spese?preset=${p.id}`);
            }}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              range.preset === p.id
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border text-muted hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowCustom((v) => !v)}
          className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
            range.preset === null
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border text-muted hover:text-foreground"
          }`}
        >
          Personalizzato
        </button>
        {showCustom && (
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/spese?from=${from}&to=${to}`);
            }}
          >
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-xl border border-border bg-surface px-2 py-1.5 text-sm text-foreground"
            />
            <span className="text-muted">–</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-xl border border-border bg-surface px-2 py-1.5 text-sm text-foreground"
            />
            <button
              type="submit"
              className="rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground"
            >
              Applica
            </button>
          </form>
        )}
      </div>

      <select
        value={categoriaSelezionata}
        onChange={(e) => onCategoriaChange(e.target.value)}
        className="w-fit rounded-xl border border-border bg-surface px-3 py-1.5 text-sm text-foreground"
      >
        <option value="tutte">Tutte le categorie</option>
        {categorie.map((c) => (
          <option key={c.id} value={c.nome}>
            {c.nome}
          </option>
        ))}
      </select>
    </div>
  );
}
