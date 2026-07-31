import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { formatCurrency } from "@/lib/spese-utils";
import type { Deposito, Spesa } from "@/lib/types";

export type TransactionListItem = {
  id: string;
  tipo: "spesa" | "entrata";
  data: string;
  titolo: string | null;
  descrizione: string | null;
  categoria_id: string | null;
  categoria_nome: string | null;
  categoria_colore: string | null;
  importo: number;
  nota: string | null;
  nominativo: string | null;
  dettaglio: string | null;
};

export function spesaToItem(s: Spesa): TransactionListItem {
  return {
    id: s.id,
    tipo: "spesa",
    data: s.data,
    titolo: s.titolo,
    descrizione: s.descrizione,
    categoria_id: s.categoria_id,
    categoria_nome: s.categoria_nome,
    categoria_colore: s.categoria_colore,
    importo: s.importo,
    nota: s.note,
    nominativo: s.nominativo,
    dettaglio: s.dettaglio,
  };
}

export function depositoToItem(d: Deposito): TransactionListItem {
  return {
    id: d.id,
    tipo: "entrata",
    data: d.data,
    titolo: d.titolo,
    descrizione: d.descrizione,
    categoria_id: d.categoria_id,
    categoria_nome: d.categoria_nome,
    categoria_colore: d.categoria_colore,
    importo: d.importo,
    nota: d.note,
    nominativo: d.nominativo,
    dettaglio: d.dettaglio,
  };
}

export function TransactionList({
  items,
  emptyLabel = "Nessuna transazione.",
  onItemClick,
}: {
  items: TransactionListItem[];
  emptyLabel?: string;
  onItemClick?: (item: TransactionListItem) => void;
}) {
  if (items.length === 0) {
    return <p className="text-xs text-muted">{emptyLabel}</p>;
  }

  return (
    <ul className="flex max-h-56 flex-col gap-1.5 overflow-y-auto">
      {items.map((item) => {
        const Icon = item.tipo === "entrata" ? ArrowUpCircle : ArrowDownCircle;
        const rowContent = (
          <>
            <Icon
              className={`h-4 w-4 shrink-0 ${item.tipo === "entrata" ? "text-entrata" : "text-spesa"}`}
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium text-foreground">
                {item.titolo ?? item.descrizione ?? "—"}
              </span>
              <span className="truncate text-muted">
                {item.categoria_nome ?? "Senza categoria"}
                {item.nota ? ` · ${item.nota}` : ""}
              </span>
            </div>
            <span
              className={`font-figures whitespace-nowrap ${
                item.tipo === "entrata" ? "text-entrata" : "text-spesa"
              }`}
            >
              {item.tipo === "entrata" ? "+" : "-"}
              {formatCurrency(item.importo)}
            </span>
          </>
        );

        return (
          <li
            key={item.id}
            className="border-b border-border/60 pb-1.5 text-xs last:border-0 last:pb-0"
          >
            {onItemClick ? (
              <button
                type="button"
                onClick={() => onItemClick(item)}
                className="flex w-full items-center gap-2 rounded-lg px-1 py-0.5 text-left transition-colors hover:bg-surface-hover"
              >
                {rowContent}
              </button>
            ) : (
              <div className="flex items-center gap-2">{rowContent}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
