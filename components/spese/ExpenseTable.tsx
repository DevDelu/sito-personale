"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { CategoryBadge } from "@/components/category-badge";
import { formatCurrency } from "@/lib/spese-utils";
import { useExpenseMutations, type MovimentoPatch } from "@/hooks/useExpenseMutations";
import {
  useBulkMovimentoMutations,
  type BulkMovimentoItem,
  type BulkMovimentoPatch,
} from "@/hooks/useBulkMovimentoMutations";
import { ExpenseEditModal } from "./ExpenseEditModal";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { BulkEditModal } from "./BulkEditModal";
import type { Categoria, Movimento } from "@/lib/types";

function rowKey(r: Movimento): string {
  return `${r.tipo}-${r.id}`;
}

export function ExpenseTable({ rows, categorie }: { rows: Movimento[]; categorie: Categoria[] }) {
  const router = useRouter();
  const { updateExpense, deleteExpense, pending, error } = useExpenseMutations();
  const bulk = useBulkMovimentoMutations();
  const [editing, setEditing] = useState<Movimento | null>(null);
  const [deleting, setDeleting] = useState<Movimento | null>(null);
  const [categorieList, setCategorieList] = useState(categorie);
  const [prevCategorie, setPrevCategorie] = useState(categorie);
  const [selezionati, setSelezionati] = useState<Set<string>>(new Set());
  const [prevRows, setPrevRows] = useState(rows);
  const [modificaBulk, setModificaBulk] = useState(false);
  const [eliminaBulk, setEliminaBulk] = useState(false);

  // Il server rifornisce `categorie` ad ogni router.refresh(): risincronizza
  // lo stato locale così che una nuova categoria creata da un'altra sessione
  // (o dopo il refresh post-salvataggio) resti coerente. Pattern "adjusting
  // state when a prop changes" (react.dev/learn/you-might-not-need-an-effect),
  // niente useEffect per evitare render a cascata.
  if (categorie !== prevCategorie) {
    setPrevCategorie(categorie);
    setCategorieList(categorie);
  }

  // Cambio pagina/filtro in Gestione = nuove `rows`: la selezione precedente
  // non ha più senso (righe non più visibili), quindi si azzera.
  if (rows !== prevRows) {
    setPrevRows(rows);
    setSelezionati(new Set());
  }

  function handleCategoriaCreata(nuova: Categoria) {
    setCategorieList((prev) =>
      prev.some((c) => c.id === nuova.id)
        ? prev
        : [...prev, nuova].sort((a, b) => a.nome.localeCompare(b.nome))
    );
  }

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

  function toggleRiga(r: Movimento) {
    setSelezionati((prev) => {
      const next = new Set(prev);
      const key = rowKey(r);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleTutte() {
    setSelezionati((prev) =>
      prev.size === rows.length ? new Set() : new Set(rows.map(rowKey))
    );
  }

  const righeSelezionate = rows.filter((r) => selezionati.has(rowKey(r)));
  const itemsSelezionati: BulkMovimentoItem[] = righeSelezionate.map((r) => ({
    id: r.id,
    tipo: r.tipo,
  }));

  async function handleBulkApply(patch: BulkMovimentoPatch) {
    await bulk.bulkUpdate(itemsSelezionati, patch);
    setModificaBulk(false);
    setSelezionati(new Set());
    router.refresh();
  }

  async function handleBulkDelete() {
    await bulk.bulkDelete(itemsSelezionati);
    setEliminaBulk(false);
    setSelezionati(new Set());
    router.refresh();
  }

  return (
    <>
      {righeSelezionate.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-accent/40 bg-accent/10 px-4 py-2.5">
          <span className="text-sm font-medium">
            {righeSelezionate.length} {righeSelezionate.length === 1 ? "selezionato" : "selezionati"}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModificaBulk(true)}
              className="rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              Modifica in blocco
            </button>
            <button
              type="button"
              onClick={() => setEliminaBulk(true)}
              className="rounded-full border border-border px-3 py-1.5 text-sm text-muted hover:bg-surface-hover hover:text-spesa"
            >
              Elimina selezionate
            </button>
            <button
              type="button"
              onClick={() => setSelezionati(new Set())}
              className="rounded-full border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground"
            >
              Deseleziona
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="w-8 px-3 py-2">
                <input
                  type="checkbox"
                  aria-label="Seleziona tutto"
                  checked={rows.length > 0 && selezionati.size === rows.length}
                  onChange={toggleTutte}
                  className="h-4 w-4 rounded border-border accent-[var(--accent)]"
                />
              </th>
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
              const key = rowKey(r);
              return (
                <tr key={key} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      aria-label="Seleziona riga"
                      checked={selezionati.has(key)}
                      onChange={() => toggleRiga(r)}
                      className="h-4 w-4 rounded border-border accent-[var(--accent)]"
                    />
                  </td>
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
                <td colSpan={8} className="px-3 py-6 text-center text-muted">
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
          categorie={categorieList}
          pending={pending}
          error={error}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          onCategoriaCreata={handleCategoriaCreata}
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

      {modificaBulk && (
        <BulkEditModal
          righeSelezionate={righeSelezionate}
          categorie={categorieList}
          pending={bulk.pending}
          error={bulk.error}
          onApply={handleBulkApply}
          onCancel={() => setModificaBulk(false)}
          onCategoriaCreata={handleCategoriaCreata}
        />
      )}

      {eliminaBulk && (
        <DeleteConfirmDialog
          titolo={righeSelezionate[0]?.titolo ?? righeSelezionate[0]?.descrizione ?? "questo movimento"}
          count={righeSelezionate.length}
          pending={bulk.pending}
          onConfirm={handleBulkDelete}
          onCancel={() => setEliminaBulk(false)}
        />
      )}
    </>
  );
}
