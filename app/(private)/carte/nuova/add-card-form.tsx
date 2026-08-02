"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { aggiungiCarta, type AggiungiCartaState } from "../actions";

const PRODUCT_TYPES = [
  { value: "carta", label: "Carta" },
  { value: "energy_marker", label: "Energy Marker" },
  { value: "sigillato", label: "Sigillato" },
] as const;

const CONDITIONS = ["NM", "EX", "GD", "LP", "PL", "PO"] as const;

const LANGUAGES = [
  { value: "EN", label: "Inglese" },
  { value: "IT", label: "Italiano" },
  { value: "JP", label: "Giapponese" },
] as const;

export function AddCardForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<AggiungiCartaState, FormData>(aggiungiCarta, undefined);

  return (
    <form action={formAction} encType="multipart/form-data" className="flex w-full max-w-lg animate-slide-up flex-col gap-4">
      <Field label="Nome carta">
        <input name="name" type="text" required className="field-input bg-surface" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Codice set" hint="Es. FB10">
          <input name="set_code" type="text" className="field-input bg-surface" />
        </Field>
        <Field label="Numero carta" hint="Es. FB10-070 — insieme al codice set serve a ricavare l'ID Cardmarket per gli aggiornamenti prezzo.">
          <input name="card_number" type="text" required className="field-input bg-surface" />
        </Field>
      </div>

      <Field label="Immagine" hint="Opzionale — foto della carta.">
        <input name="image" type="file" accept="image/*" className="field-input bg-surface file:mr-3 file:rounded-md file:border-0 file:bg-[var(--accent)]/15 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent" />
      </Field>

      <Field label="Tipo prodotto">
        <select name="product_type" defaultValue="carta" className="field-input bg-surface">
          {PRODUCT_TYPES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Quantità">
          <input name="quantity" type="number" min="1" step="1" required defaultValue={1} className="field-input bg-surface" />
        </Field>
        <Field label="Condizione">
          <select name="condition" defaultValue="NM" className="field-input bg-surface">
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
          <select name="language" defaultValue="EN" className="field-input bg-surface">
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Prezzo di acquisto (€)">
          <input name="purchase_price" type="number" min="0" step="0.01" className="field-input bg-surface" />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted">
        <input name="is_foil" type="checkbox" className="h-4 w-4 rounded border-border accent-[var(--accent)]" />
        Foil
      </label>

      <Field label="Note (opzionale)">
        <textarea name="notes" rows={2} className="field-input bg-surface" />
      </Field>

      {state?.error && (
        <p className="text-sm text-spesa" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Salvataggio..." : "Aggiungi"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Annulla
        </button>
      </div>
    </form>
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
