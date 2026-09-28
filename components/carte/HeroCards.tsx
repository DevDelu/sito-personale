"use client";

import { CardPlaceholder } from "./CardPlaceholder";
import { formatCurrency } from "@/lib/carte/format";
import { ordinePodio, type PosizionePodio } from "@/lib/carte/podio";
import type { CollectionCard } from "@/lib/carte/types";

const PODIO: Record<PosizionePodio, { colore: string; gradino: string; etichetta: string }> = {
  1: { colore: "var(--podio-oro)", gradino: "h-14 sm:h-16", etichetta: "Primo posto" },
  2: { colore: "var(--podio-argento)", gradino: "h-10 sm:h-11", etichetta: "Secondo posto" },
  3: { colore: "var(--podio-bronzo)", gradino: "h-7 sm:h-8", etichetta: "Terzo posto" },
};

// Le tre carte di maggior valore su un podio (2° – 1° – 3°): tre colonne
// strette che stanno anche a 375px, gradini di altezza diversa con il
// numero e il colore della medaglia. Modifica/elimina sono nel dettaglio
// (tap sulla carta), come per le altre carte: sul podio avrebbero affollato
// colonne da ~110px.
export function HeroCards({
  carte,
  onView,
}: {
  carte: CollectionCard[];
  onView: (carta: CollectionCard) => void;
}) {
  if (carte.length === 0) {
    return (
      <div className="card flex items-center justify-center p-8">
        <p className="text-sm text-muted">Nessuna carta ancora in collezione.</p>
      </div>
    );
  }

  return (
    <ol className="mx-auto flex w-full max-w-xl items-end justify-center gap-2 sm:gap-4">
      {ordinePodio(carte).map(({ carta: c, posizione }) => {
        const stile = PODIO[posizione];
        const prezzo = c.current_price ?? c.purchase_price;
        return (
          <li key={c.id} className="flex min-w-0 flex-1 basis-0 flex-col sm:max-w-[180px]">
            <button
              type="button"
              onClick={() => onView(c)}
              aria-label={`${stile.etichetta}: ${c.name}`}
              className="animate-slide-up flex min-w-0 flex-col gap-1.5 rounded-xl p-1 text-left transition-transform active:scale-[0.97] sm:p-1.5 md:hover:-translate-y-0.5"
            >
              <CardPlaceholder
                name={c.name}
                imageUrl={c.image_url}
                className="aspect-[5/7] w-full rounded-lg shadow-sm"
              />
              <span className="line-clamp-2 min-h-[2lh] text-xs leading-tight font-semibold sm:text-sm">
                {c.name}
              </span>
              <span className="font-figures text-sm font-bold sm:text-base">
                {prezzo !== null ? formatCurrency(prezzo) : "n/d"}
              </span>
            </button>
            <div
              aria-hidden
              className={`${stile.gradino} flex items-start justify-center rounded-t-lg border-t-2 pt-1`}
              style={{
                borderColor: stile.colore,
                backgroundColor: `color-mix(in srgb, ${stile.colore} 22%, transparent)`,
              }}
            >
              <span className="font-figures text-sm font-bold" style={{ color: stile.colore }}>
                {posizione}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
