"use client";

import { useState } from "react";
import type { CostoTipo } from "@/lib/investimenti/types";

const COSTO_TIPI: { value: CostoTipo; label: string }[] = [
  { value: "verificato", label: "Verificato" },
  { value: "stimato", label: "Stimato" },
  { value: "sconosciuto", label: "Sconosciuto" },
];

export function BulkCostoTipoModal({
  count,
  pending,
  error,
  onApply,
  onCancel,
}: {
  count: number;
  pending: boolean;
  error: string | null;
  onApply: (costoTipo: CostoTipo) => void;
  onCancel: () => void;
}) {
  const [costoTipo, setCostoTipo] = useState<CostoTipo>("verificato");

  return (
    <div className="modal-overlay">
      <div className="modal-panel w-full max-w-sm p-5">
        <h2 className="font-display text-base font-semibold">Modifica qualità del costo in blocco</h2>
        <p className="mt-1 text-sm text-muted">
          Imposta lo stesso valore di &ldquo;costo_tipo&rdquo; per le {count} transazioni selezionate.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {COSTO_TIPI.map((c) => (
            <label
              key={c.value}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors duration-150 ${
                costoTipo === c.value ? "border-accent/40 bg-accent/5" : "border-border"
              }`}
            >
              <input
                type="radio"
                name="costoTipo"
                checked={costoTipo === c.value}
                onChange={() => setCostoTipo(c.value)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              {c.label}
            </label>
          ))}
        </div>

        {error && (
          <p className="mt-3 text-sm text-spesa" role="alert">
            {error}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Annulla
          </button>
          <button type="button" disabled={pending} onClick={() => onApply(costoTipo)} className="btn-primary">
            {pending ? "Applicazione..." : "Applica"}
          </button>
        </div>
      </div>
    </div>
  );
}
