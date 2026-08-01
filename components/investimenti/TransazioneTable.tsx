"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { formatCurrency, formatQuantita } from "@/lib/investimenti/format";
import { useTransazioneMutations, type TransazionePatch } from "@/hooks/useTransazioneMutations";
import { useBulkTransazioneMutations } from "@/hooks/useBulkTransazioneMutations";
import { TransazioneFormModal } from "./TransazioneFormModal";
import { BulkCostoTipoModal } from "./BulkCostoTipoModal";
import { DeleteConfirmDialog } from "@/components/spese/DeleteConfirmDialog";
import type { Asset, CostoTipo, TransazioneConAsset } from "@/lib/investimenti/types";

const COSTO_TIPO_LABEL: Record<CostoTipo, string> = {
  verificato: "Verificato",
  stimato: "Stimato",
  sconosciuto: "Sconosciuto",
};

const COSTO_TIPO_COLOR: Record<CostoTipo, string> = {
  verificato: "var(--entrata)",
  stimato: "var(--accent)",
  sconosciuto: "var(--muted)",
};

export function TransazioneTable({ rows, assets }: { rows: TransazioneConAsset[]; assets: Asset[] }) {
  const router = useRouter();
  const { createTransazione, updateTransazione, deleteTransazione, pending, error } = useTransazioneMutations();
  const bulk = useBulkTransazioneMutations();

  const [aggiungendo, setAggiungendo] = useState(false);
  const [editing, setEditing] = useState<TransazioneConAsset | null>(null);
  const [deleting, setDeleting] = useState<TransazioneConAsset | null>(null);
  const [selezionati, setSelezionati] = useState<Set<string>>(new Set());
  const [prevRows, setPrevRows] = useState(rows);
  const [modificaBulk, setModificaBulk] = useState(false);
  const [eliminaBulk, setEliminaBulk] = useState(false);

  if (rows !== prevRows) {
    setPrevRows(rows);
    setSelezionati(new Set());
  }

  async function handleCreate(patch: TransazionePatch) {
    await createTransazione(patch);
    setAggiungendo(false);
    router.refresh();
  }

  async function handleSave(patch: TransazionePatch) {
    if (!editing) return;
    await updateTransazione(editing.id, patch);
    setEditing(null);
    router.refresh();
  }

  async function handleDelete() {
    if (!deleting) return;
    await deleteTransazione(deleting.id);
    setDeleting(null);
    router.refresh();
  }

  function toggleRiga(id: string) {
    setSelezionati((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleTutte() {
    setSelezionati((prev) => (prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.id))));
  }

  const righeSelezionate = rows.filter((r) => selezionati.has(r.id));
  const idsSelezionati = righeSelezionate.map((r) => r.id);

  async function handleBulkApply(costoTipo: CostoTipo) {
    await bulk.bulkUpdateCostoTipo(idsSelezionati, costoTipo);
    setModificaBulk(false);
    setSelezionati(new Set());
    router.refresh();
  }

  async function handleBulkDelete() {
    await bulk.bulkDelete(idsSelezionati);
    setEliminaBulk(false);
    setSelezionati(new Set());
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{rows.length} transazioni totali.</p>
        <button type="button" onClick={() => setAggiungendo(true)} className="btn-primary !px-3 !py-1.5">
          <Plus className="h-4 w-4" />
          Aggiungi transazione
        </button>
      </div>

      {righeSelezionate.length > 0 && (
        <div className="animate-slide-down flex flex-wrap items-center gap-3 rounded-xl border border-accent/40 bg-accent/10 px-4 py-2.5 shadow-sm">
          <span className="text-sm font-medium">
            {righeSelezionate.length} {righeSelezionate.length === 1 ? "selezionata" : "selezionate"}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => setModificaBulk(true)} className="btn-primary !px-3 !py-1.5">
              Modifica qualità costo
            </button>
            <button
              type="button"
              onClick={() => setEliminaBulk(true)}
              className="btn-secondary !px-3 !py-1.5 hover:!text-spesa"
            >
              Elimina selezionate
            </button>
            <button type="button" onClick={() => setSelezionati(new Set())} className="btn-secondary !px-3 !py-1.5">
              Deseleziona
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="w-8 px-3 py-2">
                <input
                  type="checkbox"
                  aria-label="Seleziona tutto"
                  checked={rows.length > 0 && selezionati.size === rows.length}
                  onChange={toggleTutte}
                  className="h-4 w-4 rounded border-border accent-[var(--accent)] transition-transform active:scale-90"
                />
              </th>
              <th className="px-3 py-2 font-medium">Data</th>
              <th className="px-3 py-2 font-medium">Asset</th>
              <th className="px-3 py-2 font-medium">Tipo</th>
              <th className="px-3 py-2 text-right font-medium">Quantità</th>
              <th className="px-3 py-2 text-right font-medium">Prezzo</th>
              <th className="px-3 py-2 font-medium">Costo</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="font-figures">
            {rows.map((r) => {
              const selezionata = selezionati.has(r.id);
              return (
                <tr
                  key={r.id}
                  className={`border-b border-border transition-colors duration-150 last:border-0 hover:bg-surface-hover ${
                    selezionata ? "bg-accent/5" : ""
                  }`}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      aria-label="Seleziona riga"
                      checked={selezionata}
                      onChange={() => toggleRiga(r.id)}
                      className="h-4 w-4 rounded border-border accent-[var(--accent)] transition-transform active:scale-90"
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-muted">
                    {new Date(`${r.data}T00:00:00Z`).toLocaleDateString("it-IT")}
                  </td>
                  <td className="px-3 py-2 font-sans">
                    <span className="font-medium">{r.asset_nome}</span>
                    <div className="text-xs text-muted">{r.ticker}</div>
                  </td>
                  <td className="px-3 py-2 font-sans capitalize text-muted">
                    {r.tipo === "buy" ? "Acquisto" : "Vendita"}
                  </td>
                  <td className="px-3 py-2 text-right">{formatQuantita(r.quantita)}</td>
                  <td className="px-3 py-2 text-right">
                    {r.prezzo_unitario === null ? "n/d" : formatCurrency(r.prezzo_unitario)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className="rounded-full border px-2 py-0.5 text-xs font-sans"
                      style={{ borderColor: COSTO_TIPO_COLOR[r.costo_tipo], color: COSTO_TIPO_COLOR[r.costo_tipo] }}
                    >
                      {COSTO_TIPO_LABEL[r.costo_tipo]}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-2">
                      <button type="button" onClick={() => setEditing(r)} aria-label="Modifica" className="btn-icon">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(r)}
                        aria-label="Elimina"
                        className="btn-icon hover:!text-spesa"
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
                  Nessuna transazione trovata.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {aggiungendo && (
        <TransazioneFormModal
          titolo="Aggiungi transazione"
          assets={assets}
          pending={pending}
          error={error}
          onSave={handleCreate}
          onCancel={() => setAggiungendo(false)}
        />
      )}

      {editing && (
        <TransazioneFormModal
          titolo="Modifica transazione"
          transazione={editing}
          assets={assets}
          pending={pending}
          error={error}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      {deleting && (
        <DeleteConfirmDialog
          titolo={`${deleting.tipo === "buy" ? "Acquisto" : "Vendita"} ${deleting.asset_nome}`}
          pending={pending}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

      {modificaBulk && (
        <BulkCostoTipoModal
          count={righeSelezionate.length}
          pending={bulk.pending}
          error={bulk.error}
          onApply={handleBulkApply}
          onCancel={() => setModificaBulk(false)}
        />
      )}

      {eliminaBulk && (
        <DeleteConfirmDialog
          titolo={`${righeSelezionate.length} transazioni`}
          count={righeSelezionate.length}
          pending={bulk.pending}
          onConfirm={handleBulkDelete}
          onCancel={() => setEliminaBulk(false)}
        />
      )}
    </>
  );
}
