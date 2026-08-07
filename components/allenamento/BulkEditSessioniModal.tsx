"use client";

import { useState } from "react";
import type { BulkSessionePatch } from "@/app/(private)/allenamenti/actions";

type CampoBulk = "durata_min" | "sensazione" | "note";

const SENSAZIONE_LABEL = ["😞", "🙁", "😐", "🙂", "💪"];

export function BulkEditSessioniModal({
  count,
  pending,
  error,
  onApply,
  onCancel,
}: {
  count: number;
  pending: boolean;
  error: string | null;
  onApply: (patch: BulkSessionePatch) => void;
  onCancel: () => void;
}) {
  const [campiAttivi, setCampiAttivi] = useState<Record<CampoBulk, boolean>>({
    durata_min: false,
    sensazione: false,
    note: false,
  });
  const [durataMin, setDurataMin] = useState("");
  const [sensazione, setSensazione] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [erroreForm, setErroreForm] = useState<string | null>(null);

  function toggleCampo(campo: CampoBulk) {
    setCampiAttivi((prev) => ({ ...prev, [campo]: !prev[campo] }));
    setErroreForm(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!Object.values(campiAttivi).some(Boolean)) {
      setErroreForm("Seleziona almeno un campo da modificare.");
      return;
    }
    setErroreForm(null);

    const patch: BulkSessionePatch = {};
    if (campiAttivi.durata_min) patch.durata_min = durataMin.trim() ? Number(durataMin) : null;
    if (campiAttivi.sensazione) patch.sensazione = sensazione;
    if (campiAttivi.note) patch.note = note.trim() || null;

    onApply(patch);
  }

  return (
    <div className="modal-overlay">
      <form onSubmit={handleSubmit} className="modal-panel flex w-full max-w-sm flex-col gap-4 p-5">
        <div>
          <h2 className="font-display text-base font-semibold">Modifica in blocco</h2>
          <p className="mt-1 text-sm text-muted">
            {count} {count === 1 ? "sessione selezionata" : "sessioni selezionate"}. Attiva i campi da
            sovrascrivere con lo stesso valore su tutte.
          </p>
        </div>

        <CampoRiga attivo={campiAttivi.durata_min} onToggle={() => toggleCampo("durata_min")} label="Durata (min)">
          <input
            type="number"
            min="0"
            value={durataMin}
            onChange={(e) => setDurataMin(e.target.value)}
            className="field-input w-full"
          />
        </CampoRiga>

        <CampoRiga attivo={campiAttivi.sensazione} onToggle={() => toggleCampo("sensazione")} label="Sensazione">
          <div className="flex gap-1.5">
            {SENSAZIONE_LABEL.map((emoji, i) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setSensazione(i + 1)}
                className={`h-9 w-9 rounded-full border text-base transition-all duration-200 ${
                  sensazione === i + 1
                    ? "border-accent bg-accent/15"
                    : "border-border hover:border-accent/40"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </CampoRiga>

        <CampoRiga attivo={campiAttivi.note} onToggle={() => toggleCampo("note")} label="Note">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="field-input w-full" />
        </CampoRiga>

        {(erroreForm || error) && (
          <p className="text-sm text-spesa" role="alert">
            {erroreForm ?? error}
          </p>
        )}

        <p className="text-xs text-muted">
          L&apos;operazione sovrascrive questi campi su tutte le sessioni selezionate e non è reversibile.
        </p>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Annulla
          </button>
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? "Applicazione..." : "Conferma"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CampoRiga({
  attivo,
  onToggle,
  label,
  children,
}: {
  attivo: boolean;
  onToggle: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border p-3 transition-colors duration-200 ${
        attivo ? "border-accent/40 bg-accent/5" : "border-border"
      }`}
    >
      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={attivo}
          onChange={onToggle}
          className="h-4 w-4 rounded border-border accent-[var(--accent)] transition-transform active:scale-90"
        />
        {label}
      </label>
      {attivo && <div className="animate-slide-down">{children}</div>}
    </div>
  );
}
