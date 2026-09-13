"use client";

import { useActionState } from "react";
import { aggiungiPeso, type RegistraPesoState } from "../actions";

const oggi = () => new Date().toISOString().slice(0, 10);

export function PesoForm() {
  const [state, formAction, pending] = useActionState<RegistraPesoState, FormData>(aggiungiPeso, undefined);

  return (
    <form action={formAction} className="card flex flex-col gap-4 p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Data">
          <input name="data" type="date" required defaultValue={oggi()} className="field-input bg-background" />
        </Field>
        <Field label="Peso (kg)">
          <input name="peso_kg" type="number" min="1" step="0.1" required className="field-input bg-background" />
        </Field>
      </div>
      <Field label="Note (opzionale)">
        <input name="note" type="text" className="field-input bg-background" />
      </Field>

      {state?.error && (
        <p className="text-sm text-spesa" role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? "Salvataggio..." : "Registra peso"}
      </button>
      <p className="text-xs text-muted">Un solo peso per giorno: ripetere la stessa data corregge il valore.</p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
