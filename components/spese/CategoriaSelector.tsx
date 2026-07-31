"use client";

import { useMemo, useState } from "react";
import type { Categoria, TipoCategoria } from "@/lib/types";
import { useCategoriaMutations } from "@/hooks/useCategoriaMutations";

const NUOVA_CATEGORIA = "__nuova__";

// Selettore categoria condiviso da Gestione (modal di modifica), dal popup
// dedicato dell'Overview e dalla pagina "aggiungi spesa": tutti e tre i punti
// devono poter creare una categoria al volo con lo stesso comportamento.
export function CategoriaSelector({
  categorie,
  tipo,
  value,
  onChange,
  onCategoriaCreata,
  name,
  sfondo = "background",
}: {
  categorie: Categoria[];
  tipo: TipoCategoria;
  value: string;
  onChange: (categoriaId: string) => void;
  onCategoriaCreata?: (categoria: Categoria) => void;
  name?: string;
  // I modal (Gestione, popup Overview) poggiano su un pannello bg-surface, quindi
  // gli input devono usare bg-background per risaltare; la pagina "aggiungi
  // spesa" invece usa bg-surface per i suoi input direttamente sulla pagina.
  sfondo?: "background" | "surface";
}) {
  const [nuovaCategoriaNome, setNuovaCategoriaNome] = useState("");
  const [nuovaCategoriaError, setNuovaCategoriaError] = useState<string | null>(null);
  const [mostraInput, setMostraInput] = useState(false);
  const { creaCategoria, pending: creandoCategoria } = useCategoriaMutations();

  const categorieFiltrate = useMemo(
    () => categorie.filter((c) => c.tipo === tipo),
    [categorie, tipo]
  );

  function handleSelectChange(v: string) {
    if (v === NUOVA_CATEGORIA) {
      setMostraInput(true);
      setNuovaCategoriaError(null);
      return;
    }
    onChange(v);
  }

  async function handleCrea() {
    const nome = nuovaCategoriaNome.trim();
    if (!nome) {
      setNuovaCategoriaError("Inserisci un nome per la nuova categoria.");
      return;
    }
    try {
      const nuova = await creaCategoria(nome, tipo);
      onCategoriaCreata?.(nuova);
      onChange(nuova.id);
      setMostraInput(false);
      setNuovaCategoriaNome("");
      setNuovaCategoriaError(null);
    } catch (e) {
      setNuovaCategoriaError((e as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <select
        name={name}
        required
        value={value}
        onChange={(e) => handleSelectChange(e.target.value)}
        className={`rounded-xl border border-border px-3 py-2 text-foreground outline-none transition-all duration-150 ease-out focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_15%,transparent)] ${
          sfondo === "surface" ? "bg-surface" : "bg-background"
        }`}
      >
        {value === "" && (
          <option value="" disabled>
            Seleziona categoria
          </option>
        )}
        {categorieFiltrate.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome}
          </option>
        ))}
        <option value={NUOVA_CATEGORIA}>+ Nuova categoria</option>
      </select>

      {mostraInput && (
        <div className="animate-slide-down flex flex-col gap-2 rounded-xl border border-dashed border-border p-3">
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={nuovaCategoriaNome}
              onChange={(e) => setNuovaCategoriaNome(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCrea();
                }
              }}
              placeholder="Nome nuova categoria"
              className="field-input flex-1"
            />
            <button type="button" onClick={handleCrea} disabled={creandoCategoria} className="btn-primary">
              {creandoCategoria ? "Salvataggio..." : "Salva"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMostraInput(false);
                setNuovaCategoriaNome("");
                setNuovaCategoriaError(null);
              }}
              className="btn-secondary"
            >
              Annulla
            </button>
          </div>
          {nuovaCategoriaError && (
            <p className="text-sm text-spesa" role="alert">
              {nuovaCategoriaError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
