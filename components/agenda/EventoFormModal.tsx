"use client";

import { useState } from "react";
import type { EventoPatch } from "@/app/(private)/agenda/actions";
import type { CategoriaEvento, Evento } from "@/lib/agenda/types";

const CATEGORIE: { value: CategoriaEvento; label: string }[] = [
  { value: "ferie", label: "Ferie" },
  { value: "visita", label: "Visita" },
  { value: "scadenza", label: "Scadenza" },
  { value: "personale", label: "Personale" },
  { value: "altro", label: "Altro" },
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventoFormModal({
  evento,
  dataIniziale,
  pending,
  error,
  onSave,
  onCancel,
}: {
  // null = creazione, altrimenti modifica di `evento`.
  evento: Evento | null;
  dataIniziale?: { data: string; titoloIniziale?: string };
  pending: boolean;
  error: string | null;
  onSave: (patch: EventoPatch) => void;
  onCancel: () => void;
}) {
  const [titolo, setTitolo] = useState(evento?.titolo ?? dataIniziale?.titoloIniziale ?? "");
  const [descrizione, setDescrizione] = useState(evento?.descrizione ?? "");
  const [luogo, setLuogo] = useState(evento?.luogo ?? "");
  const [categoria, setCategoria] = useState<CategoriaEvento>(evento?.categoria ?? "personale");
  const [tuttoIlGiorno, setTuttoIlGiorno] = useState(evento?.tutto_il_giorno ?? false);

  const dataDefault = dataIniziale?.data ?? new Date().toISOString().slice(0, 10);
  const [dataInizio, setDataInizio] = useState(evento ? toLocalInputValue(evento.data_inizio) : `${dataDefault}T09:00`);
  const [dataFine, setDataFine] = useState(evento ? toLocalInputValue(evento.data_fine) : `${dataDefault}T10:00`);
  const [erroreForm, setErroreForm] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titolo.trim()) {
      setErroreForm("Il titolo è obbligatorio.");
      return;
    }
    if (!dataInizio || !dataFine) {
      setErroreForm("Data di inizio e fine sono obbligatorie.");
      return;
    }

    const inizio = tuttoIlGiorno ? `${dataInizio.slice(0, 10)}T00:00:00.000Z` : new Date(dataInizio).toISOString();
    const fine = tuttoIlGiorno ? `${dataFine.slice(0, 10)}T23:59:59.999Z` : new Date(dataFine).toISOString();

    if (new Date(fine) < new Date(inizio)) {
      setErroreForm("La data di fine non può precedere quella di inizio.");
      return;
    }

    setErroreForm(null);
    onSave({
      titolo: titolo.trim(),
      descrizione: descrizione.trim() || null,
      luogo: luogo.trim() || null,
      data_inizio: inizio,
      data_fine: fine,
      tutto_il_giorno: tuttoIlGiorno,
      categoria,
    });
  }

  return (
    <div className="modal-overlay">
      <form onSubmit={handleSubmit} className="modal-panel flex w-full max-w-md flex-col gap-4 p-5">
        <h2 className="font-display text-base font-semibold">{evento ? "Modifica evento" : "Nuovo evento"}</h2>

        <Field label="Titolo">
          <input
            autoFocus
            value={titolo}
            onChange={(e) => setTitolo(e.target.value)}
            required
            className="field-input"
          />
        </Field>

        <label className="flex items-center gap-2 text-sm font-medium text-muted">
          <input
            type="checkbox"
            checked={tuttoIlGiorno}
            onChange={(e) => setTuttoIlGiorno(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-[var(--accent)]"
          />
          Tutto il giorno
        </label>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Inizio">
            <input
              type={tuttoIlGiorno ? "date" : "datetime-local"}
              value={tuttoIlGiorno ? dataInizio.slice(0, 10) : dataInizio}
              onChange={(e) => setDataInizio(e.target.value)}
              required
              className="field-input"
            />
          </Field>
          <Field label="Fine">
            <input
              type={tuttoIlGiorno ? "date" : "datetime-local"}
              value={tuttoIlGiorno ? dataFine.slice(0, 10) : dataFine}
              onChange={(e) => setDataFine(e.target.value)}
              required
              className="field-input"
            />
          </Field>
        </div>

        <Field label="Categoria">
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as CategoriaEvento)}
            className="field-input"
          >
            {CATEGORIE.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Luogo (opzionale)">
          <input value={luogo} onChange={(e) => setLuogo(e.target.value)} className="field-input" />
        </Field>

        <Field label="Descrizione (opzionale)">
          <textarea value={descrizione} onChange={(e) => setDescrizione(e.target.value)} rows={2} className="field-input" />
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
