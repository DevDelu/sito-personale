"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";

const PRESETS = [
  { id: "7", label: "7 giorni" },
  { id: "mese", label: "Mese" },
] as const;

export type Range = { from: string; to: string; preset: string | null };

export function FilterBar({ range }: { range: Range }) {
  const router = useRouter();
  const [showCustom, setShowCustom] = useState(false);
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);

  return (
    <div
      role="tablist"
      className="app-static flex gap-0.5 rounded-[10px] bg-surface-hover p-0.5 md:w-fit md:flex-wrap md:gap-2 md:rounded-none md:bg-transparent md:p-0"
    >
      {PRESETS.map((p) => (
        <button
          key={p.id}
          type="button"
          role="tab"
          aria-selected={range.preset === p.id}
          onClick={() => {
            setShowCustom(false);
            router.push(`/spese?preset=${p.id}`);
          }}
          className={`flex-1 rounded-[8px] px-3 py-1.5 text-center text-[15px] font-medium transition-all duration-200 ease-out active:scale-[0.97] md:flex-none md:rounded-full md:border md:py-1.5 ${
            range.preset === p.id
              ? "bg-surface text-foreground shadow-sm md:border-accent md:bg-accent md:text-accent-foreground md:shadow-sm"
              : "text-muted md:border-border md:hover:-translate-y-0.5 md:hover:text-foreground"
          }`}
        >
          {p.label}
        </button>
      ))}
      <button
        type="button"
        role="tab"
        aria-selected={range.preset === null}
        onClick={() => setShowCustom(true)}
        className={`flex-1 rounded-[8px] px-3 py-1.5 text-center text-[15px] font-medium transition-all duration-200 ease-out active:scale-[0.97] md:flex-none md:rounded-full md:border md:py-1.5 ${
          range.preset === null
            ? "bg-surface text-foreground shadow-sm md:border-accent md:bg-accent md:text-accent-foreground md:shadow-sm"
            : "text-muted md:border-border md:hover:-translate-y-0.5 md:hover:text-foreground"
        }`}
      >
        Personalizzato
      </button>

      {showCustom && (
        <Sheet onClose={() => setShowCustom(false)} className="max-w-sm p-5">
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/spese?from=${from}&to=${to}`);
              setShowCustom(false);
            }}
          >
            <h2 className="font-display text-base font-semibold">Periodo personalizzato</h2>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted">Da</span>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="field-input"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted">A</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="field-input"
              />
            </label>
            <button type="submit" className="btn-primary">
              Applica
            </button>
          </form>
        </Sheet>
      )}
    </div>
  );
}
