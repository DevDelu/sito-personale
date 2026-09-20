"use client";

import { useState } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { categoryColor } from "@/lib/category-style";
import { useCategoriaMutations } from "@/hooks/useCategoriaMutations";
import type { Categoria, TipoCategoria } from "@/lib/types";

// Picker per "Nuovo movimento": bottone che apre uno sheet con la griglia
// delle categorie (pallino colorato + nome, come il resto dell'area
// privata) invece del <select> nativo di CategoriaSelector — più leggibile,
// con lo stesso flusso di creazione al volo. Scope limitato al form di
// aggiunta: CategoriaSelector resta invariato altrove (Gestione, popup
// Overview, modifica in blocco).
export function CategoriaPickerSheet({
  categorie,
  tipo,
  value,
  onChange,
  onCategoriaCreata,
  name,
}: {
  categorie: Categoria[];
  tipo: TipoCategoria;
  value: string;
  onChange: (categoriaId: string) => void;
  onCategoriaCreata?: (categoria: Categoria) => void;
  name?: string;
}) {
  const [aperto, setAperto] = useState(false);
  const [mostraNuova, setMostraNuova] = useState(false);
  const [nuovaNome, setNuovaNome] = useState("");
  const [nuovaErrore, setNuovaErrore] = useState<string | null>(null);
  const { creaCategoria, pending: creandoCategoria } = useCategoriaMutations();

  const categorieFiltrate = categorie.filter((c) => c.tipo === tipo);
  const selezionata = categorieFiltrate.find((c) => c.id === value);

  function chiudi() {
    setAperto(false);
    setMostraNuova(false);
    setNuovaNome("");
    setNuovaErrore(null);
  }

  async function handleCrea() {
    const nome = nuovaNome.trim();
    if (!nome) {
      setNuovaErrore("Inserisci un nome per la nuova categoria.");
      return;
    }
    try {
      const nuova = await creaCategoria(nome, tipo);
      onCategoriaCreata?.(nuova);
      onChange(nuova.id);
      chiudi();
    } catch (e) {
      setNuovaErrore((e as Error).message);
    }
  }

  return (
    <>
      {/* type="hidden" è escluso dalla validazione nativa del browser (spec
          WHATWG): categoria_id mancante viene comunque bloccato lato server
          in aggiungiMovimento(), che mostra l'errore "Seleziona una
          categoria." tramite state.error. */}
      {name && <input type="hidden" name={name} value={value} />}

      <button
        type="button"
        onClick={() => setAperto(true)}
        className="field-input flex items-center justify-between gap-2 bg-surface text-left"
      >
        {selezionata ? (
          <span className="flex min-w-0 items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: selezionata.colore || categoryColor(selezionata.nome) }}
              aria-hidden
            />
            <span className="truncate">{selezionata.nome}</span>
          </span>
        ) : (
          <span className="text-muted">Seleziona categoria</span>
        )}
        <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
      </button>

      {aperto && (
        <Sheet onClose={chiudi} className="max-w-md p-5">
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-base font-semibold">Categoria</h2>

            {categorieFiltrate.length === 0 ? (
              <p className="text-sm text-muted">Nessuna categoria per questo tipo.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {categorieFiltrate.map((c) => {
                  const colore = c.colore || categoryColor(c.nome);
                  const attiva = c.id === value;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onChange(c.id);
                        chiudi();
                      }}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all duration-150 ease-out active:scale-95 ${
                        attiva ? "border-accent bg-accent/10" : "border-border"
                      }`}
                    >
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-full"
                        style={{ backgroundColor: `color-mix(in srgb, ${colore} 18%, transparent)` }}
                      >
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colore }} aria-hidden />
                      </span>
                      <span className="w-full truncate text-[13px]">{c.nome}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {mostraNuova ? (
              <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-3">
                <input
                  autoFocus
                  value={nuovaNome}
                  onChange={(e) => setNuovaNome(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCrea();
                    }
                  }}
                  placeholder="Nome nuova categoria"
                  className="field-input"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={handleCrea} disabled={creandoCategoria} className="btn-primary flex-1">
                    {creandoCategoria ? "Salvataggio..." : "Crea"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMostraNuova(false);
                      setNuovaNome("");
                      setNuovaErrore(null);
                    }}
                    className="btn-secondary"
                  >
                    Annulla
                  </button>
                </div>
                {nuovaErrore && (
                  <p className="text-sm text-spesa" role="alert">
                    {nuovaErrore}
                  </p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setMostraNuova(true)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-[15px] font-medium text-accent transition-all duration-150 ease-out active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                Nuova categoria
              </button>
            )}
          </div>
        </Sheet>
      )}
    </>
  );
}
