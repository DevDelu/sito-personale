"use client";

import { useState } from "react";
import type {
  NuovoSchedaEsercizioInput,
  SchedaEsercizioFields,
} from "@/app/(private)/allenamenti/actions";
import type { Esercizio, SchedaEsercizioConNome, TipoMetrica, TipoRiga } from "@/lib/allenamento/types";

const NUOVO_BLOCCO = "__nuovo_blocco__";
const NUOVO_ESERCIZIO = "__nuovo_esercizio__";

const TIPI_RIGA: { value: TipoRiga; label: string }[] = [
  { value: "normale", label: "Normale (serie/ripetizioni o tempo)" },
  { value: "circuito", label: "Circuito (round cronometrati)" },
  { value: "stretching", label: "Stretching" },
];

const TIPI_METRICA: { value: TipoMetrica; label: string }[] = [
  { value: "serie_rip", label: "Serie e ripetizioni" },
  { value: "serie_rip_peso", label: "Serie, ripetizioni e peso" },
  { value: "tempo", label: "A tempo" },
];

function numOrNull(v: string): number | null {
  return v.trim() ? Number(v) : null;
}

type FormState = {
  blocco: string;
  bloccoNuovo: string;
  esercizioId: string;
  esercizioNuovoNome: string;
  esercizioNuovoTipoMetrica: TipoMetrica;
  tipoRiga: TipoRiga;
  targetSerie: string;
  targetRipMin: string;
  targetRipMax: string;
  targetPeso: string;
  targetTempoSec: string;
  riposoSec: string;
  rounds: string;
  lavoroSec: string;
  pausaSec: string;
  zonaCorporea: string;
  note: string;
};

function statoIniziale(riga: SchedaEsercizioConNome | null, bloccoPreselezionato?: string): FormState {
  return {
    blocco: riga?.blocco ?? bloccoPreselezionato ?? "",
    bloccoNuovo: "",
    esercizioId: riga?.esercizio_id ?? "",
    esercizioNuovoNome: "",
    esercizioNuovoTipoMetrica: "serie_rip",
    tipoRiga: riga?.tipo_riga ?? "normale",
    targetSerie: riga?.target_serie != null ? String(riga.target_serie) : "",
    targetRipMin: riga?.target_rip_min != null ? String(riga.target_rip_min) : "",
    targetRipMax: riga?.target_rip_max != null ? String(riga.target_rip_max) : "",
    targetPeso: riga?.target_peso != null ? String(riga.target_peso) : "",
    targetTempoSec: riga?.target_tempo_sec != null ? String(riga.target_tempo_sec) : "",
    riposoSec: riga?.riposo_sec != null ? String(riga.riposo_sec) : "",
    rounds: riga?.rounds != null ? String(riga.rounds) : "",
    lavoroSec: riga?.lavoro_sec != null ? String(riga.lavoro_sec) : "",
    pausaSec: riga?.pausa_sec != null ? String(riga.pausa_sec) : "",
    zonaCorporea: riga?.zona_corporea ?? "",
    note: riga?.note ?? "",
  };
}

export function SchedaEsercizioModal({
  riga,
  blocchiEsistenti,
  catalogo,
  bloccoPreselezionato,
  pending,
  error,
  onSave,
  onCancel,
}: {
  // null = creazione di una nuova riga, altrimenti modifica di `riga`.
  riga: SchedaEsercizioConNome | null;
  blocchiEsistenti: string[];
  catalogo: Esercizio[];
  bloccoPreselezionato?: string;
  pending: boolean;
  error: string | null;
  onSave: (fields: SchedaEsercizioFields & Pick<NuovoSchedaEsercizioInput, "esercizio_id" | "nuovo_esercizio_nome" | "nuovo_esercizio_tipo_metrica">) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => statoIniziale(riga, bloccoPreselezionato));
  const [erroreForm, setErroreForm] = useState<string | null>(null);

  const mostraBloccoNuovo = form.blocco === NUOVO_BLOCCO;
  const mostraEsercizioNuovo = form.esercizioId === NUOVO_ESERCIZIO;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const bloccoFinale = mostraBloccoNuovo ? form.bloccoNuovo.trim() : form.blocco.trim();
    if (!bloccoFinale) {
      setErroreForm("Il nome del blocco è obbligatorio.");
      return;
    }
    if (!mostraEsercizioNuovo && !form.esercizioId) {
      setErroreForm("Seleziona un esercizio.");
      return;
    }
    if (mostraEsercizioNuovo && !form.esercizioNuovoNome.trim()) {
      setErroreForm("Inserisci il nome del nuovo esercizio.");
      return;
    }

    setErroreForm(null);

    const fields: SchedaEsercizioFields = {
      blocco: bloccoFinale,
      tipo_riga: form.tipoRiga,
      target_serie: numOrNull(form.targetSerie),
      target_rip_min: numOrNull(form.targetRipMin),
      target_rip_max: numOrNull(form.targetRipMax),
      target_peso: numOrNull(form.targetPeso),
      target_tempo_sec: numOrNull(form.targetTempoSec),
      riposo_sec: numOrNull(form.riposoSec),
      rounds: numOrNull(form.rounds),
      lavoro_sec: numOrNull(form.lavoroSec),
      pausa_sec: numOrNull(form.pausaSec),
      zona_corporea: form.zonaCorporea.trim() || null,
      note: form.note.trim() || null,
    };

    onSave(
      mostraEsercizioNuovo
        ? {
            ...fields,
            nuovo_esercizio_nome: form.esercizioNuovoNome.trim(),
            nuovo_esercizio_tipo_metrica: form.esercizioNuovoTipoMetrica,
          }
        : { ...fields, esercizio_id: form.esercizioId }
    );
  }

  return (
    <div className="modal-overlay">
      <form onSubmit={handleSubmit} className="modal-panel flex w-full max-w-lg flex-col gap-4 overflow-y-auto p-5">
        <h2 className="font-display text-base font-semibold">
          {riga ? `Modifica ${riga.esercizio_nome}` : "Aggiungi esercizio"}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Blocco">
            <select
              value={form.blocco}
              onChange={(e) => setForm((f) => ({ ...f, blocco: e.target.value }))}
              className="field-input"
            >
              <option value="" disabled>
                Seleziona blocco
              </option>
              {blocchiEsistenti.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
              <option value={NUOVO_BLOCCO}>+ Nuovo blocco</option>
            </select>
          </Field>
          <Field label="Tipo riga">
            <select
              value={form.tipoRiga}
              onChange={(e) => setForm((f) => ({ ...f, tipoRiga: e.target.value as TipoRiga }))}
              className="field-input"
            >
              {TIPI_RIGA.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {mostraBloccoNuovo && (
          <Field label="Nome nuovo blocco">
            <input
              autoFocus
              value={form.bloccoNuovo}
              onChange={(e) => setForm((f) => ({ ...f, bloccoNuovo: e.target.value }))}
              placeholder="es. Blocco 5 - Nome esercizi"
              className="field-input"
            />
          </Field>
        )}

        <Field label="Esercizio">
          <select
            value={form.esercizioId}
            onChange={(e) => setForm((f) => ({ ...f, esercizioId: e.target.value }))}
            className="field-input"
          >
            <option value="" disabled>
              Seleziona esercizio
            </option>
            {catalogo.map((es) => (
              <option key={es.id} value={es.id}>
                {es.nome}
              </option>
            ))}
            <option value={NUOVO_ESERCIZIO}>+ Nuovo esercizio</option>
          </select>
        </Field>

        {mostraEsercizioNuovo && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nome nuovo esercizio">
              <input
                autoFocus
                value={form.esercizioNuovoNome}
                onChange={(e) => setForm((f) => ({ ...f, esercizioNuovoNome: e.target.value }))}
                className="field-input"
              />
            </Field>
            <Field label="Metrica">
              <select
                value={form.esercizioNuovoTipoMetrica}
                onChange={(e) =>
                  setForm((f) => ({ ...f, esercizioNuovoTipoMetrica: e.target.value as TipoMetrica }))
                }
                className="field-input"
              >
                {TIPI_METRICA.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}

        {form.tipoRiga === "normale" && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Serie target">
                <input
                  type="number"
                  min="0"
                  value={form.targetSerie}
                  onChange={(e) => setForm((f) => ({ ...f, targetSerie: e.target.value }))}
                  className="field-input"
                />
              </Field>
              <Field label="Rip. min">
                <input
                  type="number"
                  min="0"
                  value={form.targetRipMin}
                  onChange={(e) => setForm((f) => ({ ...f, targetRipMin: e.target.value }))}
                  className="field-input"
                />
              </Field>
              <Field label="Rip. max">
                <input
                  type="number"
                  min="0"
                  value={form.targetRipMax}
                  onChange={(e) => setForm((f) => ({ ...f, targetRipMax: e.target.value }))}
                  className="field-input"
                />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Peso (kg)" hint="se l'esercizio lo prevede">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.targetPeso}
                  onChange={(e) => setForm((f) => ({ ...f, targetPeso: e.target.value }))}
                  className="field-input"
                />
              </Field>
              <Field label="Tempo (sec)" hint="per esercizi a tempo">
                <input
                  type="number"
                  min="0"
                  value={form.targetTempoSec}
                  onChange={(e) => setForm((f) => ({ ...f, targetTempoSec: e.target.value }))}
                  className="field-input"
                />
              </Field>
              <Field label="Riposo (sec)">
                <input
                  type="number"
                  min="0"
                  value={form.riposoSec}
                  onChange={(e) => setForm((f) => ({ ...f, riposoSec: e.target.value }))}
                  className="field-input"
                />
              </Field>
            </div>
          </>
        )}

        {form.tipoRiga === "circuito" && (
          <div className="grid grid-cols-3 gap-4">
            <Field label="Round">
              <input
                type="number"
                min="0"
                value={form.rounds}
                onChange={(e) => setForm((f) => ({ ...f, rounds: e.target.value }))}
                className="field-input"
              />
            </Field>
            <Field label="Lavoro (sec)">
              <input
                type="number"
                min="0"
                value={form.lavoroSec}
                onChange={(e) => setForm((f) => ({ ...f, lavoroSec: e.target.value }))}
                className="field-input"
              />
            </Field>
            <Field label="Pausa (sec)">
              <input
                type="number"
                min="0"
                value={form.pausaSec}
                onChange={(e) => setForm((f) => ({ ...f, pausaSec: e.target.value }))}
                className="field-input"
              />
            </Field>
          </div>
        )}

        {form.tipoRiga === "stretching" && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tempo (sec)">
              <input
                type="number"
                min="0"
                value={form.targetTempoSec}
                onChange={(e) => setForm((f) => ({ ...f, targetTempoSec: e.target.value }))}
                className="field-input"
              />
            </Field>
            <Field label="Zona corporea">
              <input
                value={form.zonaCorporea}
                onChange={(e) => setForm((f) => ({ ...f, zonaCorporea: e.target.value }))}
                placeholder="es. Gambe, Petto"
                className="field-input"
              />
            </Field>
          </div>
        )}

        <Field label="Note (opzionale)">
          <textarea
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            rows={2}
            className="field-input"
          />
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
