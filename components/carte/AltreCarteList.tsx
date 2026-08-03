"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { CardPlaceholder } from "./CardPlaceholder";
import { formatCurrency, formatVariazione, variazioneColorVar, variazionePercentuale } from "@/lib/carte/format";
import type { CollectionCard } from "@/lib/carte/types";

const TOOLTIP_OFFSET = 16;
const TOOLTIP_WIDTH = 168;

export function AltreCarteList({
  carte,
  onEdit,
  onDelete,
}: {
  carte: CollectionCard[];
  onEdit: (carta: CollectionCard) => void;
  onDelete: (carta: CollectionCard) => void;
}) {
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
            key={c.id}
            onMouseMove={(e) => handleMove(e, c)}
            onMouseLeave={() => setHover(null)}
            className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 text-sm transition-colors duration-150 last:border-0 hover:bg-surface-hover"
          >
            <span className="truncate">{c.name}</span>
            <div className="flex shrink-0 items-center gap-4">
              {c.current_price !== null ? (
                <>
                  <span
                    className={`text-xs font-medium whitespace-nowrap ${c.is_manual_price ? "text-muted/70" : ""}`}
                    style={c.is_manual_price ? undefined : { color: `var(${colorVar})` }}
                  >
                    {c.is_manual_price ? "manuale" : formatVariazione(variazione)}
                  </span>
                  <span className="font-figures w-20 text-right">{formatCurrency(c.current_price)}</span>
                </>
              ) : c.purchase_price !== null ? (
                <>
                  <span className="text-xs text-muted/70 whitespace-nowrap">acquisto</span>
                  <span className="font-figures w-20 text-right">{formatCurrency(c.purchase_price)}</span>
                </>
              ) : (
                <span
                  className="w-20 shrink-0 truncate rounded-full border border-border px-2 py-0.5 text-right text-[10px] font-medium tracking-wide text-muted uppercase"
                  title="Prezzo non disponibile"
                >
                  Prezzo n/d
                </span>
              )}
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => onEdit(c)} aria-label="Modifica" className="btn-icon">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(c)}
                  aria-label="Elimina"
                  className="btn-icon hover:!text-spesa"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
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
