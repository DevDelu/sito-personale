"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { CategoryBadge } from "@/components/category-badge";
import { formatCurrency } from "@/lib/spese-utils";
import { useExpenseMutations, type MovimentoPatch } from "@/hooks/useExpenseMutations";
import { ExpenseEditModal } from "./ExpenseEditModal";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { Categoria, Movimento } from "@/lib/types";

export function ExpenseTable({ rows, categorie }: { rows: Movimento[]; categorie: Categoria[] }) {
  const router = useRouter();
  const { updateExpense, deleteExpense, pending, error } = useExpenseMutations();
  const [editing, setEditing] = useState<Movimento | null>(null);
  const [deleting, setDeleting] = useState<Movimento | null>(null);

  async function handleSave(patch: MovimentoPatch) {
    if (!editing) return;
    await updateExpense(editing.tipo, editing.id, patch);
    setEditing(null);
    router.refresh();
  }

  async function handleDelete() {
    if (!deleting) return;
    await deleteExpense(deleting.tipo, deleting.id);
    setDeleting(null);
    router.refresh();
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Data</th>
              <th className="px-3 py-2 font-medium">Titolo</th>
              <th className="px-3 py-2 font-medium">Categoria</th>
              <th className="px-3 py-2 font-medium">Tipo</th>
              <th className="px-3 py-2 font-medium">Fonte</th>
              <th className="px-3 py-2 text-right font-medium">Importo</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const extra =
                r.categoria_nome === "Bonifici" && r.nominativo
                  ? r.nominativo
                  : r.categoria_nome === "PayPal" && r.dettaglio
                    ? r.dettaglio
                    : null;
              return (
                <tr key={`${r.tipo}-${r.id}`} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 whitespace-nowrap text-muted">
                    {new Date(`${r.data}T00:00:00Z`).toLocaleDateString("it-IT")}
                  </td>
                  <td className="px-3 py-2">
                    <span>{r.titolo ?? r.descrizione ?? "—"}</span>
                    {extra && <div className="text-xs text-muted">{extra}</div>}
                  </td>
                  <td className="px-3 py-2">
                    <CategoryBadge nome={r.categoria_nome} colore={r.categoria_colore} />
                  </td>
                  <td className="px-3 py-2 text-muted capitalize">{r.tipo}</td>
                  <td className="px-3 py-2 text-xs text-muted/70">{r.fonte}</td>
                  <td className="px-3 py-2 text-right font-figures">{formatCurrency(r.importo)}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(r)}
                        aria-label="Modifica"
                        className="rounded-full p-1.5 text-muted hover:bg-surface-hover hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(r)}
                        aria-label="Elimina"
                        className="rounded-full p-1.5 text-muted hover:bg-surface-hover hover:text-spesa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted">
                  Nessun movimento trovato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <ExpenseEditModal
          movimento={editing}
          categorie={categorie}
          pending={pending}
          error={error}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      {deleting && (
        <DeleteConfirmDialog
          titolo={deleting.titolo ?? deleting.descrizione ?? "questo movimento"}
          pending={pending}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
