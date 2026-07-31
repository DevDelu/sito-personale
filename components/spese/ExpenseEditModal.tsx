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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-border bg-surface p-5"
      >
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
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Salvataggio..." : "Salva"}
          </button>
        </div>
      </form>
    </div>
  );
}
