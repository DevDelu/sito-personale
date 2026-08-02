import { CardPlaceholder } from "./CardPlaceholder";
import { formatCurrency, formatVariazione, variazioneColorVar, variazionePercentuale } from "@/lib/carte/format";
import type { CollectionCard } from "@/lib/carte/types";

const RANK_LABEL = ["N.1 PER VALORE", "N.2 PER VALORE", "N.3 PER VALORE"];

export function HeroCards({ carte }: { carte: CollectionCard[] }) {
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
        const variazione = variazionePercentuale(c.current_price, c.avg30);
        const colorVar = variazioneColorVar(variazione);

        return (
          <div key={c.id} className="card card-hover animate-slide-up flex flex-col gap-3 p-4">
            <span className="w-fit rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-accent uppercase">
              {RANK_LABEL[i]}
            </span>

            <CardPlaceholder
              name={c.name}
              imageUrl={c.image_url}
              className="aspect-[5/7] w-full rounded-lg"
            />

            <div className="flex flex-col gap-0.5">
              <span className="font-display text-sm leading-tight font-semibold">{c.name}</span>
              {c.current_price !== null ? (
                <>
                  <span className="text-xs text-muted">Prezzo attuale (trend)</span>
                  <span className="font-figures text-xl font-bold">{formatCurrency(c.current_price)}</span>
                  <span className="text-xs font-medium" style={{ color: `var(${colorVar})` }}>
                    {formatVariazione(variazione)}
                  </span>
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
