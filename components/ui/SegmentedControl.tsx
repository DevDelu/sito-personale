"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type SegmentedItem = { href: string; label: string };

// Sottosezioni di modulo (Overview / Gestione / Importa...) come segmented
// control iOS: gli item arrivano da SIDEBAR_SECTIONS[...].subsections, senza
// duplicare le etichette in un secondo posto.
export function SegmentedControl({ items }: { items: SegmentedItem[] }) {
  const pathname = usePathname();

  return (
    <div role="tablist" className="app-static flex gap-0.5 rounded-[10px] bg-surface-hover p-0.5 md:hidden">
      {items.map((item) => {
        const attivo = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            role="tab"
            aria-selected={attivo}
            className={`flex-1 rounded-[8px] px-3 py-1.5 text-center text-[15px] font-medium transition-all duration-150 ease-out active:scale-[0.97] ${
              attivo ? "bg-surface text-foreground shadow-sm" : "text-muted"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
