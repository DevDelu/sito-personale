"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { usePastoMutations, type PastoPatch } from "@/hooks/usePastoMutations";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { PastoEditModal } from "./PastoEditModal";
import type { Pasto } from "@/lib/alimentazione/types";

const LABEL_TIPO: Record<string, string> = {
  colazione: "Colazione",
  pranzo: "Pranzo",
  cena: "Cena",
  spuntino: "Spuntino",
};

export function PastoTable({ rows }: { rows: Pasto[] }) {
  const router = useRouter();
  const { updatePasto, deletePasto, pending, error } = usePastoMutations();
  const [editing, setEditing] = useState<Pasto | null>(null);
  const [deleting, setDeleting] = useState<Pasto | null>(null);

  async function handleSave(patch: PastoPatch) {
    if (!editing) return;
    await updatePasto(editing.id, patch);
    setEditing(null);
    router.refresh();
  }

  async function handleDelete() {
    if (!deleting) return;
    await deletePasto(deleting.id);
    setDeleting(null);
    router.refresh();
  }

  if (rows.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 p-8 text-center text-sm text-muted">
        Nessun pasto trovato per i filtri selezionati.
      </div>
    );
  }

  return (
    <>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Alimento</th>
              <th className="px-4 py-3 text-right font-medium">Quantità</th>
              <th className="px-4 py-3 text-right font-medium">Kcal</th>
              <th className="px-4 py-3 text-right font-medium">P / C / G</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-surface-hover">
                <td className="px-4 py-3 font-figures">{p.data}</td>
                <td className="px-4 py-3">{LABEL_TIPO[p.tipo_pasto] ?? p.tipo_pasto}</td>
                <td className="px-4 py-3">
                  {p.alimento_nome}
                  {p.note && <div className="text-xs text-muted">{p.note}</div>}
                </td>
                <td className="px-4 py-3 text-right font-figures">{p.quantita_g}g</td>
                <td className="px-4 py-3 text-right font-figures">{Math.round(p.kcal)}</td>
                <td className="px-4 py-3 text-right font-figures text-xs text-muted">
                  {Math.round(p.proteine_g)} / {Math.round(p.carboidrati_g)} / {Math.round(p.grassi_g)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(p)}
                      aria-label="Modifica pasto"
                      className="btn-icon"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(p)}
                      aria-label="Elimina pasto"
                      className="btn-icon"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <PastoEditModal
          pasto={editing}
          pending={pending}
          error={error}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      {deleting && (
        <DeleteConfirmDialog
          titolo={deleting.alimento_nome}
          pending={pending}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          title="Eliminare questo pasto?"
          description={
            <>
              &ldquo;{deleting.alimento_nome}&rdquo; ({deleting.quantita_g}g) verrà rimosso definitivamente.
              L&apos;operazione non è reversibile.
            </>
          }
        />
      )}
    </>
  );
}
