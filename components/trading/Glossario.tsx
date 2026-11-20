"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CATEGORIE_GLOSSARIO, GLOSSARIO, type CategoriaGlossario } from "@/lib/trading/glossario";

const normalizza = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export function Glossario() {
  const [testo, setTesto] = useState("");
  const [categoria, setCategoria] = useState<CategoriaGlossario | "Tutte">("Tutte");

  const voci = useMemo(() => {
    const q = normalizza(testo.trim());
    return GLOSSARIO.filter(
      (v) =>
        (categoria === "Tutte" || v.categoria === categoria) &&
        (!q || normalizza(v.termine).includes(q) || normalizza(v.definizione).includes(q)),
    ).sort((a, b) => a.termine.localeCompare(b.termine, "it"));
  }, [testo, categoria]);

  return (
    <div className="flex flex-col gap-4">
      <label className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted" />
        <input
          type="search"
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
          placeholder="Cerca un termine (es. spread, hawkish, RSI)"
          aria-label="Cerca nel glossario"
          className="field-input min-h-11 w-full pl-9 text-[17px]"
        />
      </label>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Categoria">
        {(["Tutte", ...CATEGORIE_GLOSSARIO] as const).map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={categoria === c}
            onClick={() => setCategoria(c)}
            className={`min-h-9 rounded-full border px-3 text-[13px] font-medium [@media(pointer:coarse)]:min-h-11 ${
              categoria === c ? "border-transparent bg-accent text-accent-foreground" : "border-border text-muted"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="text-[13px] text-muted">{voci.length} termini</p>

      <dl className="flex flex-col divide-y divide-border rounded-[var(--app-card-radius)] border border-border bg-surface">
        {voci.map((v) => (
          <div key={v.termine} className="flex flex-col gap-1 px-4 py-3">
            <dt className="flex items-baseline justify-between gap-3">
              <span className="text-[17px] font-semibold">{v.termine}</span>
              <span className="shrink-0 text-[13px] text-muted">{v.categoria}</span>
            </dt>
            <dd className="text-[15px] leading-relaxed text-foreground/90">{v.definizione}</dd>
            {v.lezione && (
              <dd>
                <Link href={`/trading/${v.lezione}`} className="inline-flex min-h-9 items-center text-[13px] font-medium text-accent">
                  Vai alla lezione →
                </Link>
              </dd>
            )}
          </div>
        ))}
        {voci.length === 0 && <div className="px-4 py-6 text-center text-[15px] text-muted">Nessun termine trovato.</div>}
      </dl>
    </div>
  );
}
