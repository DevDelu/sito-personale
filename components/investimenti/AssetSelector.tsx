"use client";

import { useState } from "react";
import { useAssetMutations } from "@/hooks/useAssetMutations";
import type { Asset, TipoAsset } from "@/lib/investimenti/types";

const NUOVO_ASSET = "__nuovo__";

const TIPI: { value: TipoAsset; label: string }[] = [
  { value: "etf", label: "ETF" },
  { value: "etc", label: "ETC" },
  { value: "stock", label: "Azione" },
  { value: "indice", label: "Indice" },
  { value: "crypto", label: "Crypto" },
];

export function AssetSelector({
  assets,
  value,
  onChange,
  onAssetCreato,
}: {
  assets: Asset[];
  value: string;
  onChange: (assetId: string) => void;
  onAssetCreato?: (asset: Asset) => void;
}) {
  const [mostraForm, setMostraForm] = useState(false);
  const [ticker, setTicker] = useState("");
  const [nome, setNome] = useState("");
  const [isin, setIsin] = useState("");
  const [tipo, setTipo] = useState<TipoAsset>("etf");
  const [erroreForm, setErroreForm] = useState<string | null>(null);
  const { creaAsset, pending } = useAssetMutations();

  function handleSelectChange(v: string) {
    if (v === NUOVO_ASSET) {
      setMostraForm(true);
      setErroreForm(null);
      return;
    }
    onChange(v);
  }

  async function handleCrea() {
    if (!ticker.trim() || !nome.trim()) {
      setErroreForm("Inserisci ticker e nome.");
      return;
    }
    try {
      const nuovo = await creaAsset({ ticker: ticker.trim(), nome: nome.trim(), tipo, isin: isin.trim() || null });
      onAssetCreato?.(nuovo);
      onChange(nuovo.id);
      setMostraForm(false);
      setTicker("");
      setNome("");
      setIsin("");
      setErroreForm(null);
    } catch (e) {
      setErroreForm((e as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <select
        required
        value={value}
        onChange={(e) => handleSelectChange(e.target.value)}
        className="field-input w-full"
      >
        {value === "" && (
          <option value="" disabled>
            Seleziona asset
          </option>
        )}
        {assets.map((a) => (
          <option key={a.id} value={a.id}>
            {a.nome} ({a.ticker})
          </option>
        ))}
        <option value={NUOVO_ASSET}>+ Nuovo asset</option>
      </select>

      {mostraForm && (
        <div className="animate-slide-down flex flex-col gap-2 rounded-xl border border-dashed border-border p-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              autoFocus
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="Ticker"
              className="field-input"
            />
            <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoAsset)} className="field-input">
              {TIPI.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome"
            className="field-input"
          />
          <input
            value={isin}
            onChange={(e) => setIsin(e.target.value)}
            placeholder="ISIN (opzionale)"
            className="field-input"
          />
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleCrea} disabled={pending} className="btn-primary">
              {pending ? "Salvataggio..." : "Salva"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMostraForm(false);
                setErroreForm(null);
              }}
              className="btn-secondary"
            >
              Annulla
            </button>
          </div>
          {erroreForm && (
            <p className="text-sm text-spesa" role="alert">
              {erroreForm}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
