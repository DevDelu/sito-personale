"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { AlimentoSelector } from "./AlimentoSelector";
import type { Alimento, ComposizioneItem, TemplatePasto, TipoPasto } from "@/lib/alimentazione/types";

const LABEL_TIPO: Record<TipoPasto, string> = {
  colazione: "Colazione",
  pranzo: "Pranzo",
  cena: "Cena",
  spuntino: "Spuntino",
};

const LABEL_GIORNO: Record<number, string> = {
  1: "Lunedì",
  2: "Martedì",
  3: "Mercoledì",
  4: "Giovedì",
  5: "Venerdì",
  6: "Sabato",
  7: "Domenica",
};

type Riga = { alimentoId: string; quantita: string };

export type TemplateSavePayload = {
  nome: string;
  composizione: ComposizioneItem[];
  note: string | null;
  tipoPasto?: TipoPasto; // solo per i jolly, vedi giornoSettimana === null sotto
};

// Modale di modifica cella del template settimanale: stesso pattern di
// PastoEditModal, adattato per una composizione a più righe (alimento +
// quantità) invece di un singolo alimento, con AlimentoSelector riusato per
// ogni riga (compresa la creazione inline di un alimento nuovo).
//
// Con giornoSettimana === null (jolly, non legato a una cella della
// griglia) il tipo pasto è scelto dall'utente invece di essere fissato dalla
// colonna della griglia.
export function TemplateEditModal({
  giornoSettimana,
  tipoPasto,
  template,
  alimenti,
  pending,
  error,
  onSave,
  onDelete,
  onCancel,
}: {
  giornoSettimana: number | null;
  tipoPasto: TipoPasto;
  template: TemplatePasto | null;
  alimenti: Alimento[];
  pending: boolean;
  error: string | null;
  onSave: (payload: TemplateSavePayload) => void;
  onDelete?: () => void;
  onCancel: () => void;
}) {
  const isJolly = giornoSettimana === null;
  const [alimentiList, setAlimentiList] = useState(alimenti);
  const [nome, setNome] = useState(template?.nome ?? "");
  const [note, setNote] = useState(template?.note ?? "");
  const [tipoPastoScelto, setTipoPastoScelto] = useState<TipoPasto>(template?.tipo_pasto ?? tipoPasto);
  const [righe, setRighe] = useState<Riga[]>(
    template && template.composizione.length > 0
      ? template.composizione.map((c) => ({ alimentoId: c.alimento_id, quantita: String(c.quantita_g) }))
      : [{ alimentoId: "", quantita: "" }]
  );
  const [formError, setFormError] = useState<string | null>(null);

  function handleAlimentoCreato(nuovo: Alimento) {
    setAlimentiList((prev) =>
      prev.some((a) => a.id === nuovo.id) ? prev : [...prev, nuovo].sort((a, b) => a.nome.localeCompare(b.nome))
    );
  }

  function aggiornaRiga(index: number, patch: Partial<Riga>) {
    setRighe((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function rimuoviRiga(index: number) {
    setRighe((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  function aggiungiRiga() {
    setRighe((prev) => [...prev, { alimentoId: "", quantita: "" }]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const nomeTrim = nome.trim();
    if (!nomeTrim) return setFormError("Inserisci un nome per il pasto.");

    const righeValide = righe.filter((r) => r.alimentoId);
    const composizione: ComposizioneItem[] = [];
    for (const r of righeValide) {
      const quantita = Number(r.quantita.replace(",", "."));
      if (!Number.isFinite(quantita) || quantita <= 0) {
        return setFormError("Ogni alimento in composizione deve avere una quantità positiva.");
      }
      composizione.push({ alimento_id: r.alimentoId, quantita_g: quantita });
    }

    onSave({ nome: nomeTrim, composizione, note: note.trim() || null, ...(isJolly ? { tipoPasto: tipoPastoScelto } : {}) });
  }

  return (
    <div className="modal-overlay">
      <form onSubmit={handleSubmit} className="modal-panel flex w-full max-w-lg flex-col gap-4 p-5">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display text-base font-semibold">
            {isJolly ? "Jolly" : `${LABEL_GIORNO[giornoSettimana] ?? giornoSettimana} · ${LABEL_TIPO[tipoPasto]}`}
          </h2>
          <p className="text-sm text-muted">
            {isJolly
              ? "Alternativa veloce non legata a un giorno fisso, selezionabile manualmente dal quick-add."
              : "Nome del pasto e composizione (alimento + grammi per ogni voce)."}
          </p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted">Nome</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} className="field-input" />
        </label>

        {isJolly && (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-muted">Tipo pasto</span>
            <select
              value={tipoPastoScelto}
              onChange={(e) => setTipoPastoScelto(e.target.value as TipoPasto)}
              className="field-input"
            >
              {Object.entries(LABEL_TIPO).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted">Composizione</span>
          {righe.map((riga, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex-1">
                <AlimentoSelector
                  alimenti={alimentiList}
                  value={riga.alimentoId}
                  onChange={(id) => aggiornaRiga(index, { alimentoId: id })}
                  onAlimentoCreato={handleAlimentoCreato}
                />
              </div>
              <input
                value={riga.quantita}
                onChange={(e) => aggiornaRiga(index, { quantita: e.target.value })}
                placeholder="g"
                inputMode="decimal"
                className="field-input w-20 shrink-0"
              />
              <button
                type="button"
                onClick={() => rimuoviRiga(index)}
                aria-label="Rimuovi voce"
                className="btn-icon mt-1 shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={aggiungiRiga} className="btn-secondary self-start !px-3 !py-1.5 text-xs">
            + Aggiungi alimento
          </button>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted">Note</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="field-input" />
        </label>

        {(formError || error) && (
          <p className="text-sm text-spesa" role="alert">
            {formError ?? error}
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          {onDelete ? (
            <button type="button" onClick={onDelete} disabled={pending} className="btn-secondary !text-spesa">
              Elimina
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="btn-secondary">
              Annulla
            </button>
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? "Salvataggio..." : "Salva"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
