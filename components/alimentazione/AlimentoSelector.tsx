"use client";

import { useMemo, useState } from "react";
import type { Alimento } from "@/lib/alimentazione/types";
import { useAlimentoMutations } from "@/hooks/useAlimentoMutations";

// Autocomplete + creazione inline di un alimento, stesso pattern UX di
// CategoriaSelector.tsx (Spese): un campo di ricerca che filtra il catalogo
// personale, con un'opzione "+ crea nuovo alimento" che apre un mini-form
// (nome + valori/100g) senza uscire dal flusso di logging pasto.
export function AlimentoSelector({
  alimenti,
  value,
  onChange,
  onAlimentoCreato,
}: {
  alimenti: Alimento[];
  value: string;
  onChange: (alimentoId: string) => void;
  onAlimentoCreato?: (alimento: Alimento) => void;
}) {
  const [query, setQuery] = useState("");
  const [mostraLista, setMostraLista] = useState(false);
  const [mostraForm, setMostraForm] = useState(false);
  const [nome, setNome] = useState("");
  const [kcal, setKcal] = useState("");
  const [proteine, setProteine] = useState("");
  const [carboidrati, setCarboidrati] = useState("");
  const [grassi, setGrassi] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const { creaAlimento, pending } = useAlimentoMutations();

  const selezionato = alimenti.find((a) => a.id === value) ?? null;

  const risultati = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return alimenti.slice(0, 20);
    return alimenti.filter((a) => a.nome.toLowerCase().includes(q)).slice(0, 20);
  }, [alimenti, query]);

  function selezionaAlimento(a: Alimento) {
    onChange(a.id);
    setQuery(a.nome);
    setMostraLista(false);
  }

  function apriCreazione() {
    setNome(query.trim());
    setMostraForm(true);
    setMostraLista(false);
    setFormError(null);
  }

  async function handleCrea() {
    const nomeTrim = nome.trim();
    const kcalNum = Number(kcal.replace(",", "."));
    if (!nomeTrim) return setFormError("Inserisci un nome per l'alimento.");
    if (!Number.isFinite(kcalNum) || kcalNum < 0) return setFormError("Le kcal per 100g non sono valide.");

    try {
      const nuovo = await creaAlimento({
        nome: nomeTrim,
        kcal100g: kcalNum,
        proteine100g: Number(proteine.replace(",", ".")) || 0,
        carboidrati100g: Number(carboidrati.replace(",", ".")) || 0,
        grassi100g: Number(grassi.replace(",", ".")) || 0,
      });
      onAlimentoCreato?.(nuovo);
      selezionaAlimento(nuovo);
      setMostraForm(false);
      setNome("");
      setKcal("");
      setProteine("");
      setCarboidrati("");
      setGrassi("");
    } catch (e) {
      setFormError((e as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <input
          type="text"
          value={mostraLista ? query : (selezionato?.nome ?? query)}
          onChange={(e) => {
            setQuery(e.target.value);
            setMostraLista(true);
            if (value) onChange("");
          }}
          onFocus={() => setMostraLista(true)}
          placeholder="Cerca un alimento..."
          className="field-input w-full bg-surface"
        />
        {mostraLista && (
          <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-surface shadow-lg animate-slide-down">
            {risultati.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => selezionaAlimento(a)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-surface-hover"
              >
                <span>{a.nome}</span>
                <span className="font-figures text-xs text-muted">{a.kcal_100g} kcal/100g</span>
              </button>
            ))}
            <button
              type="button"
              onClick={apriCreazione}
              className="flex w-full items-center gap-1.5 border-t border-border px-3 py-2 text-left text-sm font-medium text-accent hover:bg-surface-hover"
            >
              + Crea nuovo alimento{query.trim() ? ` "${query.trim()}"` : ""}
            </button>
          </div>
        )}
      </div>

      {mostraForm && (
        <div className="animate-slide-down flex flex-col gap-2 rounded-xl border border-dashed border-border p-3">
          <input
            autoFocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome alimento"
            className="field-input"
          />
          <div className="grid grid-cols-3 gap-2">
            <FieldMini label="Kcal/100g">
              <input
                value={kcal}
                onChange={(e) => setKcal(e.target.value)}
                inputMode="decimal"
                className="field-input"
              />
            </FieldMini>
            <FieldMini label="Proteine/100g">
              <input
                value={proteine}
                onChange={(e) => setProteine(e.target.value)}
                inputMode="decimal"
                className="field-input"
              />
            </FieldMini>
            <FieldMini label="Carbo/100g">
              <input
                value={carboidrati}
                onChange={(e) => setCarboidrati(e.target.value)}
                inputMode="decimal"
                className="field-input"
              />
            </FieldMini>
          </div>
          <FieldMini label="Grassi/100g">
            <input
              value={grassi}
              onChange={(e) => setGrassi(e.target.value)}
              inputMode="decimal"
              className="field-input w-32"
            />
          </FieldMini>
          {formError && (
            <p className="text-sm text-spesa" role="alert">
              {formError}
            </p>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={handleCrea} disabled={pending} className="btn-primary">
              {pending ? "Salvataggio..." : "Salva alimento"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMostraForm(false);
                setFormError(null);
              }}
              className="btn-secondary"
            >
              Annulla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldMini({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}
