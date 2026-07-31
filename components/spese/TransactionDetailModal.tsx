"use client";

import { useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { CategoryBadge } from "@/components/category-badge";
import { formatCurrency } from "@/lib/spese-utils";
import { useExpenseMutations } from "@/hooks/useExpenseMutations";
import { useMovimentoForm } from "@/hooks/useMovimentoForm";
import { MovimentoFormFields } from "./MovimentoFormFields";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { TransactionListItem } from "./TransactionList";
import type { Categoria } from "@/lib/types";

// Popup dedicato dell'Overview (grafico trend + grafico a torta): distinto dal
// modal di modifica di Gestione, ma riusa lo stesso hook/campi di form.
export function TransactionDetailModal({
  transazione,
  categorie,
  onClose,
  onCategoriaCreata,
  onChanged,
}: {
  transazione: TransactionListItem;
  categorie: Categoria[];
  onClose: () => void;
  onCategoriaCreata?: (categoria: Categoria) => void;
  onChanged: () => void;
}) {
  const [modalita, setModalita] = useState<"dettaglio" | "modifica">("dettaglio");
  const [confermaEliminazione, setConfermaEliminazione] = useState(false);
  const { updateExpense, deleteExpense, pending, error } = useExpenseMutations();
  const form = useMovimentoForm(transazione, categorie);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await updateExpense(transazione.tipo, transazione.id, form.buildPatch());
    onChanged();
    onClose();
  }

  async function handleDelete() {
    await deleteExpense(transazione.tipo, transazione.id);
    onChanged();
    onClose();
  }

  const dataLabel = new Date(`${transazione.data}T00:00:00Z`).toLocaleDateString("it-IT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="modal-overlay">
      <div className="modal-panel w-full max-w-md p-5">
        {modalita === "dettaglio" ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-display text-base font-semibold">
                {transazione.titolo ?? transazione.descrizione ?? "Movimento"}
              </h2>
              <button type="button" onClick={onClose} aria-label="Chiudi" className="btn-icon">
                <X className="h-4 w-4" />
              </button>
            </div>

            <dl className="flex animate-fade-in flex-col gap-2 text-sm">
              <Row label="Data" value={<span className="capitalize">{dataLabel}</span>} />
              <Row
                label="Importo"
                value={
                  <span
                    className={`font-figures ${transazione.tipo === "entrata" ? "text-entrata" : "text-spesa"}`}
                  >
                    {transazione.tipo === "entrata" ? "+" : "-"}
                    {formatCurrency(transazione.importo)}
                  </span>
                }
              />
              <Row
                label="Categoria"
                value={
                  <CategoryBadge nome={transazione.categoria_nome} colore={transazione.categoria_colore} />
                }
              />
              {transazione.descrizione && <Row label="Descrizione" value={transazione.descrizione} />}
              {transazione.nota && <Row label="Nota" value={transazione.nota} />}
              {transazione.nominativo && <Row label="Nominativo" value={transazione.nominativo} />}
              {transazione.dettaglio && <Row label="Dettaglio" value={transazione.dettaglio} />}
            </dl>

            {error && (
              <p className="text-sm text-spesa" role="alert">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfermaEliminazione(true)}
                className="btn-secondary hover:!text-spesa"
              >
                <Trash2 className="h-4 w-4" />
                Elimina
              </button>
              <button type="button" onClick={() => setModalita("modifica")} className="btn-primary">
                <Pencil className="h-4 w-4" />
                Modifica
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex animate-fade-in flex-col gap-4">
            <h2 className="font-display text-base font-semibold">Modifica movimento</h2>

            <MovimentoFormFields
              form={form}
              categorie={categorie}
              tipo={transazione.tipo}
              onCategoriaCreata={onCategoriaCreata}
            />

            {error && (
              <p className="text-sm text-spesa" role="alert">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setModalita("dettaglio")} className="btn-secondary">
                Annulla
              </button>
              <button type="submit" disabled={pending} className="btn-primary">
                {pending ? "Salvataggio..." : "Salva"}
              </button>
            </div>
          </form>
        )}
      </div>

      {confermaEliminazione && (
        <DeleteConfirmDialog
          titolo={transazione.titolo ?? transazione.descrizione ?? "questo movimento"}
          pending={pending}
          onConfirm={handleDelete}
          onCancel={() => setConfermaEliminazione(false)}
        />
      )}
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
