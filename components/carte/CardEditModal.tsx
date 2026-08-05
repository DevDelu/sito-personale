"use client";

import { useMemo, useState } from "react";
import { CardPlaceholder } from "./CardPlaceholder";
import { aggiornaImmagineCarta } from "@/app/(private)/carte/actions";
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
  const [name, setName] = useState(carta.name);
  const [cardNumber, setCardNumber] = useState(carta.card_number ?? "");
  const [quantity, setQuantity] = useState(String(carta.quantity));
  const [condition, setCondition] = useState<CardCondition>(carta.condition ?? "NM");
  const [language, setLanguage] = useState(carta.language);
  const [purchasePrice, setPurchasePrice] = useState(
    carta.purchase_price !== null ? String(carta.purchase_price) : ""
  );
  const [manualPrice, setManualPrice] = useState(carta.manual_price !== null ? String(carta.manual_price) : "");
  const [notes, setNotes] = useState(carta.notes ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePending, setImagePending] = useState(false);
  const [erroreForm, setErroreForm] = useState<string | null>(null);

  // Object URL derivato al render, non in un effetto: la revoca esplicita
  // non serve, il blob viene liberato alla chiusura del modale/navigazione.
  const imagePreviewUrl = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : null), [imageFile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setErroreForm("Il titolo della carta è obbligatorio.");
      return;
    }
    if (!cardNumber.trim()) {
      setErroreForm("Il codice carta è obbligatorio.");
      return;
    }
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

    if (imageFile) {
      setImagePending(true);
      const fd = new FormData();
      fd.set("image", imageFile);
      const res = await aggiornaImmagineCarta(carta.card_id, fd);
      setImagePending(false);
      if (res?.error) {
        setErroreForm(res.error);
        return;
      }
    }

    onSave({
      name: name.trim(),
      card_number: cardNumber.trim(),
      quantity: quantityNum,
      condition,
      language,
      purchase_price: purchasePriceNum,
      manual_price: manualPriceNum,
      notes: notes.trim() || null,
    });
  }

  return (
    <div className="modal-overlay">
      <form onSubmit={handleSubmit} className="modal-panel flex w-full max-w-md flex-col gap-4 p-5">
        <h2 className="font-display text-base font-semibold">Modifica {carta.name}</h2>

        <div className="flex items-center gap-4">
          <CardPlaceholder
            name={carta.name}
            imageUrl={imagePreviewUrl ?? carta.image_url}
            className="aspect-[5/7] w-16 shrink-0 rounded-lg"
          />
          <Field label="Immagine" hint="Opzionale — sostituisce quella attuale.">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="field-input file:mr-3 file:rounded-md file:border-0 file:bg-[var(--accent)]/15 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Titolo carta">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="field-input"
            />
          </Field>
          <Field label="Codice carta">
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="es. E-111"
              required
              className="field-input"
            />
          </Field>
        </div>

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
          hint="Registrato come prezzo di oggi: modificandolo più volte nei giorni successivi costruisci l'andamento nel grafico."
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
          <button type="submit" disabled={pending || imagePending} className="btn-primary">
            {imagePending ? "Caricamento immagine..." : pending ? "Salvataggio..." : "Salva"}
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
