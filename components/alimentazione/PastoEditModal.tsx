"use client";

import { useState } from "react";
import type { Pasto, TipoPasto } from "@/lib/alimentazione/types";
import type { PastoPatch } from "@/hooks/usePastoMutations";

const TIPI: { value: TipoPasto; label: string }[] = [
  { value: "colazione", label: "Colazione" },
  { value: "pranzo", label: "Pranzo" },
  { value: "cena", label: "Cena" },
  { value: "spuntino", label: "Spuntino" },
];

export function PastoEditModal({
  pasto,
  pending,
  error,
  onSave,
  onCancel,
}: {
  pasto: Pasto;
  pending: boolean;
  error: string | null;
  onSave: (patch: PastoPatch) => void;
  onCancel: () => void;
}) {
  const [data, setData] = useState(pasto.data);
  const [tipoPasto, setTipoPasto] = useState<TipoPasto>(pasto.tipo_pasto);
  const [quantita, setQuantita] = useState(String(pasto.quantita_g));
  const [note, setNote] = useState(pasto.note ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      data,
      tipoPasto,
      quantitaG: Number(quantita.replace(",", ".")),
      note: note.trim() || null,
    });
  }

  return (
    <div className="modal-overlay">
      <form onSubmit={handleSubmit} className="modal-panel flex w-full max-w-md flex-col gap-4 p-5">
        <h2 className="font-display text-base font-semibold">Modifica pasto</h2>
        <p className="text-sm text-muted">
          {pasto.alimento_nome} — la quantità aggiorna kcal/macro in proporzione allo snapshot originale.
        </p>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted">Tipo pasto</span>
          <select
            value={tipoPasto}
            onChange={(e) => setTipoPasto(e.target.value as TipoPasto)}
            className="field-input"
          >
            {TIPI.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-muted">Data</span>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="field-input" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-muted">Quantità (g)</span>
            <input
              type="number"
              min="1"
              value={quantita}
              onChange={(e) => setQuantita(e.target.value)}
              className="field-input"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted">Note</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="field-input" />
        </label>

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
