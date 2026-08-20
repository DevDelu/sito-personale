"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { CategoryBadge } from "@/components/category-badge";
import { formatCurrency, formatFonte } from "@/lib/spese-utils";
import { TransactionDetailModal } from "./TransactionDetailModal";
import type { TransactionListItem } from "./TransactionList";
import type { Categoria } from "@/lib/types";

function dayLabel(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("it-IT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// Modale unico per tutte le transazioni di un giorno (entrate e uscite
// insieme): sostituisce il vecchio flusso a due step (mini-popover per giorni
// con più movimenti, modal diretto per giorni con uno solo). Click su una
// riga apre comunque il TransactionDetailModal esistente per modifica/eliminazione.
export function DayDetailModal({
  giorno,
  items,
  categorie,
  onClose,
  onCategoriaCreata,
  onChanged,
}: {
  giorno: string;
  items: TransactionListItem[];
  categorie: Categoria[];
  onClose: () => void;
  onCategoriaCreata?: (categoria: Categoria) => void;
  onChanged: () => void;
}) {
  const [dettaglio, setDettaglio] = useState<TransactionListItem | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleChanged() {
    onChanged();
  }

  return (
    <>
      <div
        className="modal-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="modal-panel w-full max-w-lg p-5">
          <div className="mb-4 flex items-start justify-between gap-2">
            <h2 className="font-display text-base font-semibold capitalize">{dayLabel(giorno)}</h2>
            <button type="button" onClick={onClose} aria-label="Chiudi" className="btn-icon">
              <X className="h-4 w-4" />
            </button>
          </div>

          {items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Nessuna transazione in questo giorno.</p>
          ) : (
            <ul className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setDettaglio(item)}
                    className="flex w-full flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-border/60 px-3 py-2.5 text-left text-sm transition-all duration-150 ease-out hover:border-border hover:bg-surface-hover active:scale-[0.99]"
                  >
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.tipo === "entrata"
                          ? "bg-entrata/15 text-entrata"
                          : "bg-spesa/15 text-spesa"
                      }`}
                    >
                      {item.tipo === "entrata" ? "Entrata" : "Uscita"}
                    </span>
                    <CategoryBadge nome={item.categoria_nome} colore={item.categoria_colore} />
                    <span className="min-w-0 flex-1 truncate text-foreground">
                      {item.titolo ?? item.descrizione ?? "—"}
                    </span>
                    <span
                      className={`font-figures whitespace-nowrap ${
                        item.tipo === "entrata" ? "text-entrata" : "text-spesa"
                      }`}
                    >
                      {item.tipo === "entrata" ? "+" : "-"}
                      {formatCurrency(item.importo)}
                    </span>
                    <span className="w-full shrink-0 text-xs text-muted sm:w-auto">
                      {formatFonte(item.fonte)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {dettaglio && (
        <TransactionDetailModal
          transazione={dettaglio}
          categorie={categorie}
          onClose={() => setDettaglio(null)}
          onCategoriaCreata={onCategoriaCreata}
          onChanged={handleChanged}
        />
      )}
    </>
  );
}
