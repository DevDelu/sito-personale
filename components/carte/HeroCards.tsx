"use client";

import { Pencil, Trash2 } from "lucide-react";
import { CardPlaceholder } from "./CardPlaceholder";
import { formatCurrency } from "@/lib/carte/format";
import type { CollectionCard } from "@/lib/carte/types";

const RANK_LABEL = ["N.1 PER VALORE", "N.2 PER VALORE", "N.3 PER VALORE"];

export function HeroCards({
  carte,
  onView,
  onEdit,
  onDelete,
}: {
  carte: CollectionCard[];
  onView: (carta: CollectionCard) => void;
  onEdit: (carta: CollectionCard) => void;
  onDelete: (carta: CollectionCard) => void;
}) {
  if (carte.length === 0) {
    return (
      <div className="card flex items-center justify-center p-8">
        <p className="text-sm text-muted">Nessuna carta ancora in collezione.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {carte.map((c, i) => {
        return (
          <div
            key={c.id}
            onClick={() => onView(c)}
            className="card card-hover animate-slide-up mx-auto flex w-full max-w-[240px] cursor-pointer flex-col gap-3 p-4 sm:max-w-none"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="w-fit rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-accent uppercase">
                {RANK_LABEL[i]}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(c);
                  }}
                  aria-label="Modifica"
                  className="btn-icon"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(c);
                  }}
                  aria-label="Elimina"
                  className="btn-icon hover:!text-spesa"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <CardPlaceholder
              name={c.name}
              imageUrl={c.image_url}
              className="aspect-[5/7] w-full rounded-lg"
            />

            <div className="flex flex-col gap-0.5">
              <span className="font-display text-sm leading-tight font-semibold">{c.name}</span>
              {c.card_number && <span className="font-figures text-xs text-muted/70">{c.card_number}</span>}
              {c.current_price !== null ? (
                <>
                  <span className="text-xs text-muted">Prezzo attuale</span>
                  <span className="font-figures text-xl font-bold">{formatCurrency(c.current_price)}</span>
                </>
              ) : c.purchase_price !== null ? (
                <>
                  <span className="text-xs text-muted">Prezzo di acquisto</span>
                  <span className="font-figures text-xl font-bold">{formatCurrency(c.purchase_price)}</span>
                  <span className="text-xs text-muted/70">prezzo di mercato non disponibile</span>
                </>
              ) : (
                <span className="mt-0.5 w-fit rounded-full border border-border px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted uppercase">
                  Prezzo non disponibile
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
