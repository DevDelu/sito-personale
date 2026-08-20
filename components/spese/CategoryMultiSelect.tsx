"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export type CategoriaOption = { nome: string; colore: string | null };

// Multi-select da zero: nessun componente dropdown/combobox riutilizzabile
// esisteva nel design system (solo <select> nativi single-select altrove).
// Selezione vuota = "tutte le categorie".
export function CategoryMultiSelect({
  options,
  selected,
  onChange,
}: {
  options: CategoriaOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggle(nome: string) {
    onChange(selected.includes(nome) ? selected.filter((n) => n !== nome) : [...selected, nome]);
  }

  const label =
    selected.length === 0
      ? "Tutte le categorie"
      : selected.length === 1
        ? selected[0]
        : `${selected.length} categorie selezionate`;

  return (
    <div ref={ref} className="relative w-fit">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="field-input flex items-center gap-2 bg-surface px-3 py-1.5 text-sm"
      >
        <span className="max-w-[14rem] truncate">{label}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted" />
      </button>

      {open && (
        <div className="animate-scale-in absolute left-0 top-[calc(100%+4px)] z-20 w-56 rounded-xl border border-border bg-surface p-2 shadow-xl">
          <div className="mb-1 flex items-center justify-between px-1">
            <span className="text-xs text-muted">Categorie</span>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-accent hover:underline"
              >
                Azzera
              </button>
            )}
          </div>
          <ul className="flex max-h-56 flex-col overflow-y-auto">
            {options.map((c) => (
              <li key={c.nome}>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1.5 text-sm transition-colors hover:bg-surface-hover">
                  <input
                    type="checkbox"
                    checked={selected.includes(c.nome)}
                    onChange={() => toggle(c.nome)}
                    className="h-3.5 w-3.5 accent-accent"
                  />
                  <span className="truncate">{c.nome}</span>
                </label>
              </li>
            ))}
            {options.length === 0 && (
              <li className="px-1.5 py-1.5 text-xs text-muted">Nessuna categoria disponibile.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
