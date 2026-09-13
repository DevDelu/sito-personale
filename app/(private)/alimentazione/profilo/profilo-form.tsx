"use client";

import { useActionState, useState } from "react";
import { aggiornaProfilo, type SalvaProfiloState } from "../actions";
import type { FaseObiettivo, LivelloAttivita, ProfiloNutrizionale } from "@/lib/alimentazione/types";

const LIVELLI: { value: LivelloAttivita; label: string }[] = [
  { value: "sedentario", label: "Sedentario" },
  { value: "leggero", label: "Leggero (1-3 allenamenti/sett.)" },
  { value: "moderato", label: "Moderato (3-5 allenamenti/sett.)" },
  { value: "attivo", label: "Attivo (6-7 allenamenti/sett.)" },
  { value: "molto_attivo", label: "Molto attivo (lavoro fisico + sport)" },
];

const FASI: { value: FaseObiettivo; label: string }[] = [
  { value: "mantenimento", label: "Mantenimento" },
  { value: "surplus", label: "Surplus" },
  { value: "deficit", label: "Deficit" },
];

export function ProfiloForm({ profilo }: { profilo: ProfiloNutrizionale | null }) {
  const [state, formAction, pending] = useActionState<SalvaProfiloState, FormData>(aggiornaProfilo, undefined);
  const [fase, setFase] = useState<FaseObiettivo>(profilo?.fase_obiettivo ?? "mantenimento");

  return (
    <form action={formAction} className="card flex flex-col gap-4 p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Altezza (cm)">
          <input
            name="altezza_cm"
            type="number"
            min="1"
            step="0.1"
            required
            defaultValue={profilo?.altezza_cm ?? ""}
            className="field-input bg-background"
          />
        </Field>
        <Field label="Età">
          <input
            name="eta"
            type="number"
            min="1"
            step="1"
            required
            defaultValue={profilo?.eta ?? ""}
            className="field-input bg-background"
          />
        </Field>
        <Field label="Sesso">
          <select name="sesso" required defaultValue={profilo?.sesso ?? ""} className="field-input bg-background">
            <option value="" disabled>
              Seleziona
            </option>
            <option value="M">Maschio</option>
            <option value="F">Femmina</option>
          </select>
        </Field>
        <Field label="Livello di attività">
          <select
            name="livello_attivita"
            defaultValue={profilo?.livello_attivita ?? "sedentario"}
            className="field-input bg-background"
          >
            {LIVELLI.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Fase obiettivo">
          <select
            name="fase_obiettivo"
            value={fase}
            onChange={(e) => setFase(e.target.value as FaseObiettivo)}
            className="field-input bg-background"
          >
            {FASI.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </Field>
        {fase !== "mantenimento" && (
          <Field label={`Percentuale ${fase} (%)`}>
            <input
              name="percentuale_fase"
              type="number"
              min="0"
              max="100"
              step="1"
              defaultValue={profilo?.percentuale_fase ?? 10}
              className="field-input bg-background animate-slide-down"
            />
          </Field>
        )}
      </div>

      {state?.error && (
        <p className="text-sm text-spesa" role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? "Salvataggio..." : "Salva profilo"}
      </button>
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
