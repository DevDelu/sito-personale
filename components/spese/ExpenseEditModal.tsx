"use client";

import type { Categoria, Movimento } from "@/lib/types";
import type { MovimentoPatch } from "@/hooks/useExpenseMutations";
import { useMovimentoForm } from "@/hooks/useMovimentoForm";
import { MovimentoFormFields } from "./MovimentoFormFields";

export function ExpenseEditModal({
  movimento,
  categorie,
  pending,
  error,
  onSave,
  onCancel,
  onCategoriaCreata,
}: {
  movimento: Movimento;
  categorie: Categoria[];
  pending: boolean;
  error: string | null;
  onSave: (patch: MovimentoPatch) => void;
  onCancel: () => void;
  onCategoriaCreata?: (categoria: Categoria) => void;
}) {
  const form = useMovimentoForm(movimento, categorie);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form.buildPatch());
  }

  return (
    <div className="modal-overlay">
      <form onSubmit={handleSubmit} className="modal-panel flex w-full max-w-md flex-col gap-4 p-5">
        <h2 className="font-display text-base font-semibold">Modifica movimento</h2>

        <MovimentoFormFields
          form={form}
          categorie={categorie}
          tipo={movimento.tipo}
          onCategoriaCreata={onCategoriaCreata}
        />

        {error && (
          <p className="text-sm text-spesa" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Annulla
          </button>
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? "Salvataggio..." : "Salva"}
          </button>
        </div>
      </form>
    </div>
  );
}
