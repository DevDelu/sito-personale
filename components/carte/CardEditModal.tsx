"use client";

import { useState } from "react";
import type { CardCondition, CollectionCard } from "@/lib/carte/types";
import type { ModificaCartaPatch } from "@/app/(private)/carte/actions";

const CONDITIONS: CardCondition[] = ["NM", "EX", "GD", "LP", "PL", "PO"];

const LANGUAGES = [
  { value: "EN", label: "Inglese" },
  { value: "IT", label: "Italiano" },
  { value: "JP", label: "Giapponese" },
] as const;

export function CardEditModal({
  carta,
  pending,
  error,
  onSave,
  onCancel,
}: {
  carta: CollectionCard;
  pending: boolean;
  error: string | null;
  onSave: (patch: ModificaCartaPatch) => void;
  onCancel: () => void;
}) {
  const [quantity, setQuantity] = useState(String(carta.quantity));
  const [condition, setCondition] = useState<CardCondition>(carta.condition ?? "NM");
  const [language, setLanguage] = useState(carta.language);
  const [isFoil, setIsFoil] = useState(carta.is_foil);
  const [purchasePrice, setPurchasePrice] = useState(
    carta.purchase_price !== null ? String(carta.purchase_price) : ""
  );
  const [manualPrice, setManualPrice] = useState(carta.manual_price !== null ? String(carta.manual_price) : "");
  const [notes, setNotes] = useState(carta.notes ?? "");
  const [erroreForm, setErroreForm] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const quantityNum = Number(quantity);
    if (!Number.isFinite(quantityNum) || quantityNum <= 0) {
      setErroreForm("La quantità deve essere un numero positivo.");
      return;
    }
    const purchasePriceNum = purchasePrice.trim() ? Number(purchasePrice.replace(",", ".")) : null;
    if (purchasePriceNum !== null && !Number.isFinite(purchasePriceNum)) {
      setErroreForm("Il prezzo di acquisto deve essere un numero valido.");
      return;
    }
    const manualPriceNum = manualPrice.trim() ? Number(manualPrice.replace(",", ".")) : null;
    if (manualPriceNum !== null && !Number.isFinite(manualPriceNum)) {
      setErroreForm("Il prezzo attuale manuale deve essere un numero valido.");
      return;
    }

    setErroreForm(null);
    onSave({
      quantity: quantityNum,
      condition,
      language,
      is_foil: isFoil,
      purchase_price: purchasePriceNum,
      manual_price: manualPriceNum,
      notes: notes.trim() || null,
    });
  }

  return (
    <div className="modal-overlay">
      <form onSubmit={handleSubmit} className="modal-panel flex w-full max-w-md flex-col gap-4 p-5">
        <h2 className="font-display text-base font-semibold">Modifica {carta.name}</h2>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Quantità">
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="field-input"
            />
          </Field>
          <Field label="Condizione">
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as CardCondition)}
              className="field-input"
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Lingua">
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="field-input">
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Prezzo di acquisto (€)">
            <input
              type="number"
              min="0"
              step="0.01"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              className="field-input"
            />
          </Field>
        </div>

        <Field
          label="Prezzo attuale manuale (€)"
          hint="Se compilato, sovrascrive il prezzo automatico da Cardmarket."
        >
          <input
            type="number"
            min="0"
            step="0.01"
            value={manualPrice}
            onChange={(e) => setManualPrice(e.target.value)}
            className="field-input"
          />
        </Field>

        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={isFoil}
            onChange={(e) => setIsFoil(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-[var(--accent)]"
          />
          Foil
        </label>

        <Field label="Note (opzionale)">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="field-input" />
        </Field>

        {(erroreForm || error) && (
          <p className="text-sm text-spesa" role="alert">
            {erroreForm ?? error}
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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-muted">
        {label}
        {hint && <span className="ml-1.5 text-xs font-normal text-muted/70">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
