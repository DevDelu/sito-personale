"use client";

import { useState } from "react";
import { CardPlaceholder } from "./CardPlaceholder";
import { formatCurrency, formatVariazione, variazioneColorVar, variazionePercentuale } from "@/lib/carte/format";
import type { CollectionCard } from "@/lib/carte/types";

const TOOLTIP_OFFSET = 16;
const TOOLTIP_WIDTH = 168;

export function AltreCarteList({ carte }: { carte: CollectionCard[] }) {
  const [hover, setHover] = useState<{ carta: CollectionCard; x: number; y: number } | null>(null);

  if (carte.length === 0) {
    return (
      <div className="card flex items-center justify-center p-6">
        <p className="text-sm text-muted">Nient&apos;altro in collezione, per ora.</p>
      </div>
    );
  }

  function handleMove(e: React.MouseEvent, carta: CollectionCard) {
    setHover({ carta, x: e.clientX, y: e.clientY });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {carte.map((c) => {
        const variazione = variazionePercentuale(c.current_price, c.avg30);
        const colorVar = variazioneColorVar(variazione);

        return (
          <div
            key={c.id_product}
            onMouseMove={(e) => handleMove(e, c)}
            onMouseLeave={() => setHover(null)}
            className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 text-sm transition-colors duration-150 last:border-0 hover:bg-surface-hover"
          >
            <span className="truncate">{c.name}</span>
            <div className="flex shrink-0 items-center gap-4">
              <span className="text-xs font-medium whitespace-nowrap" style={{ color: `var(${colorVar})` }}>
                {formatVariazione(variazione)}
              </span>
              <span className="font-figures w-20 text-right">
                {c.current_price !== null ? formatCurrency(c.current_price) : "n/d"}
              </span>
            </div>
          </div>
        );
      })}

      {hover && (
        <div
          className="animate-fade-in pointer-events-none fixed z-50"
          style={{ left: hover.x + TOOLTIP_OFFSET, top: hover.y + TOOLTIP_OFFSET, width: TOOLTIP_WIDTH }}
        >
          <div className="card overflow-hidden p-1.5 shadow-2xl">
            <div className="relative aspect-[5/7] w-full overflow-hidden rounded-lg">
              <CardPlaceholder name={hover.carta.name} imageUrl={hover.carta.image_url} className="absolute inset-0 h-full w-full" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2">
                <span className="text-xs leading-tight font-medium text-white">{hover.carta.name}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
