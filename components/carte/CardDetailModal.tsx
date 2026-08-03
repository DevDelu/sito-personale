"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Pencil, Trash2, X } from "lucide-react";
import { CardPlaceholder } from "./CardPlaceholder";
import {
  formatCurrency,
  formatVariazione,
  variazioneColorVar,
  variazionePercentuale,
  PRODUCT_TYPE_LABEL,
  LANGUAGE_LABEL,
} from "@/lib/carte/format";
import { getStoricoPrezzo } from "@/app/(private)/carte/actions";
import type { PricePoint } from "@/lib/carte/queries";
import type { CollectionCard } from "@/lib/carte/types";

// recharts (~400KB) resta fuori dal bundle principale di /carte: il grafico
// serve solo quando il popup di dettaglio è aperto, non al caricamento pagina.
const CardPriceChart = dynamic(() => import("./CardPriceChart").then((m) => m.CardPriceChart), {
  ssr: false,
  loading: () => <div className="h-24 w-full animate-pulse rounded-lg bg-surface-hover" />,
});

export function CardDetailModal({
  carta,
  onClose,
  onEdit,
  onDelete,
}: {
  carta: CollectionCard;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const variazione = variazionePercentuale(carta.current_price, carta.avg30);
  const colorVar = variazioneColorVar(variazione);

  const [history, setHistory] = useState<PricePoint[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getStoricoPrezzo(carta.id, carta.id_product)
      .then((data) => {
        if (!cancelled) setHistory(data);
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      });
    return () => {
      cancelled = true;
    };
  }, [carta.id, carta.id_product]);

  return (
    <div className="modal-overlay">
      <div className="modal-panel flex w-full max-w-md flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-display text-base font-semibold">{carta.name}</h2>
          <button type="button" onClick={onClose} aria-label="Chiudi" className="btn-icon">
            <X className="h-4 w-4" />
          </button>
        </div>

        <CardPlaceholder
          name={carta.name}
          imageUrl={carta.image_url}
          className="aspect-[5/7] w-full max-w-[220px] self-center rounded-lg"
        />

        {history === null ? (
          <div className="h-24 w-full animate-pulse rounded-lg bg-surface-hover" />
        ) : (
          <CardPriceChart history={history} />
        )}

        <dl className="flex animate-fade-in flex-col gap-2 text-sm">
          {carta.card_number && <Row label="Codice carta" value={<span className="font-figures">{carta.card_number}</span>} />}
          <Row label="Tipo" value={PRODUCT_TYPE_LABEL[carta.product_type]} />
          <Row label="Quantità" value={String(carta.quantity)} />
          <Row label="Condizione" value={carta.condition ?? "n/d"} />
          <Row label="Lingua" value={LANGUAGE_LABEL[carta.language] ?? carta.language} />
          {carta.purchase_price !== null && (
            <Row label="Prezzo di acquisto" value={formatCurrency(carta.purchase_price)} />
          )}
          <Row
            label="Prezzo attuale"
            value={carta.current_price !== null ? formatCurrency(carta.current_price) : "n/d"}
          />
          {!carta.is_manual_price && carta.current_price !== null && (
            <Row
              label="Variazione vs media 30gg"
              value={<span style={{ color: `var(${colorVar})` }}>{formatVariazione(variazione)}</span>}
            />
          )}
          {carta.snapshot_date && (
            <Row
              label="Ultimo aggiornamento prezzo"
              value={new Date(`${carta.snapshot_date}T00:00:00Z`).toLocaleDateString("it-IT")}
            />
          )}
          {carta.notes && <Row label="Note" value={carta.notes} />}
        </dl>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onDelete} className="btn-secondary hover:!text-spesa">
            <Trash2 className="h-4 w-4" />
            Elimina
          </button>
          <button type="button" onClick={onEdit} className="btn-primary">
            <Pencil className="h-4 w-4" />
            Modifica
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
