"use client";

import { useState } from "react";
import { AssetSelector } from "./AssetSelector";
import type { TransazionePatch } from "@/hooks/useTransazioneMutations";
import type { Asset, CostoTipo, TipoTransazione, Transazione } from "@/lib/investimenti/types";

const COSTO_TIPI: { value: CostoTipo; label: string; hint: string }[] = [
  { value: "verificato", label: "Verificato", hint: "Prezzo/quantità noti con certezza (estratto conto, exchange)." },
  { value: "stimato", label: "Stimato", hint: "Dato aggregato o prezzo approssimato, da affinare." },
  { value: "sconosciuto", label: "Sconosciuto", hint: "Quantità nota, costo ignoto: esclusa dal calcolo di plusvalenza." },
];

export function TransazioneFormModal({
  titolo,
  transazione,
  assets,
  pending,
  error,
  onSave,
  onCancel,
}: {
  titolo: string;
  transazione?: Transazione;
  assets: Asset[];
  pending: boolean;
  error: string | null;
  onSave: (patch: TransazionePatch) => void;
  onCancel: () => void;
}) {
  const [assetsList, setAssetsList] = useState(assets);
  const [assetId, setAssetId] = useState(transazione?.asset_id ?? "");
  const [tipo, setTipo] = useState<TipoTransazione>(transazione?.tipo ?? "buy");
  const [quantita, setQuantita] = useState(transazione ? String(transazione.quantita) : "");
  const [prezzoUnitario, setPrezzoUnitario] = useState(
    transazione?.prezzo_unitario !== undefined && transazione?.prezzo_unitario !== null
      ? String(transazione.prezzo_unitario)
      : ""
  );
  const [data, setData] = useState(transazione?.data ?? "");
  const [costoTipo, setCostoTipo] = useState<CostoTipo>(transazione?.costo_tipo ?? "verificato");
  const [note, setNote] = useState(transazione?.note ?? "");
  const [erroreForm, setErroreForm] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assetId) {
      setErroreForm("Seleziona un asset.");
      return;
    }
    const quantitaNum = Number(quantita.replace(",", "."));
    if (!Number.isFinite(quantitaNum) || quantitaNum <= 0) {
      setErroreForm("Inserisci una quantità valida.");
      return;
    }
    if (!data) {
      setErroreForm("Seleziona una data.");
      return;
    }
    const prezzoNum = prezzoUnitario.trim() ? Number(prezzoUnitario.replace(",", ".")) : null;
    if (prezzoNum !== null && !Number.isFinite(prezzoNum)) {
      setErroreForm("Inserisci un prezzo unitario valido.");
      return;
    }
    setErroreForm(null);
    onSave({
      asset_id: assetId,
      tipo,
      quantita: quantitaNum,
      prezzo_unitario: prezzoNum,
      data,
      costo_tipo: costoTipo,
      note: note.trim() || null,
    });
  }

  return (
    <div className="modal-overlay">
      <form onSubmit={handleSubmit} className="modal-panel flex w-full max-w-md flex-col gap-4 p-5">
        <h2 className="font-display text-base font-semibold">{titolo}</h2>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted">Asset</label>
          <AssetSelector
            assets={assetsList}
            value={assetId}
            onChange={setAssetId}
            onAssetCreato={(nuovo) =>
              setAssetsList((prev) => (prev.some((a) => a.id === nuovo.id) ? prev : [...prev, nuovo]))
            }
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted">Tipo</label>
          <div className="flex gap-2">
            {(["buy", "sell"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`flex-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200 ease-out active:scale-95 ${
                  tipo === t
                    ? "border-accent bg-accent text-accent-foreground shadow-sm"
                    : "border-border text-muted hover:-translate-y-0.5 hover:text-foreground"
                }`}
              >
                {t === "buy" ? "Acquisto" : "Vendita"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted">Quantità</label>
            <input
              value={quantita}
              onChange={(e) => setQuantita(e.target.value)}
              placeholder="0.00"
              inputMode="decimal"
              className="field-input"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted">Prezzo unitario (€)</label>
            <input
              value={prezzoUnitario}
              onChange={(e) => setPrezzoUnitario(e.target.value)}
              placeholder="Opzionale"
              inputMode="decimal"
              className="field-input"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted">Data</label>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="field-input" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted">Qualità del costo</label>
          <select value={costoTipo} onChange={(e) => setCostoTipo(e.target.value as CostoTipo)} className="field-input">
            {COSTO_TIPI.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted">{COSTO_TIPI.find((c) => c.value === costoTipo)?.hint}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted">Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Opzionale"
            className="field-input resize-none"
          />
        </div>

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
