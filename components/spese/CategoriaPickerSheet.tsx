"use client";

import { useState } from "react";
import { Check, ChevronRight, Plus } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { useColoriCategorie } from "@/hooks/useColoriCategorie";
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
  const coloreDi = useColoriCategorie(categorie);

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
          WHATWG): categoria_id vuoto è ammesso: aggiungiMovimento() usa "Altro". */}
      {name && <input type="hidden" name={name} value={value} />}

      <button
        type="button"
        onClick={() => setAperto(true)}
        className="field-input flex items-center justify-between gap-2 bg-surface text-left"
      >
        {selezionata ? (
          <span
            className="min-w-0 truncate rounded-lg px-2 py-0.5"
            style={{
              backgroundColor: `color-mix(in srgb, ${coloreDi(selezionata.nome, selezionata.colore)} 22%, transparent)`,
            }}
          >
            {selezionata.nome}
          </span>
        ) : (
          <span className="text-muted">Nessuna (Altro)</span>
        )}
        <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
      </button>

      {aperto && (
        <Sheet onClose={chiudi} className="max-w-md p-5" area="spese.scegli-categoria">
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-base font-semibold">Categoria</h2>

            {categorieFiltrate.length === 0 ? (
              <p className="text-sm text-muted">Nessuna categoria per questo tipo.</p>
            ) : (
              <div className="flex max-h-[50dvh] flex-col gap-1.5 overflow-y-auto">
                {value && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange("");
                      chiudi();
                    }}
                    className="rounded-xl border border-dashed border-border px-3 py-2.5 text-left text-[15px] text-muted active:scale-[0.99]"
                  >
                    Nessuna (verrà messa su Altro)
                  </button>
                )}
                {categorieFiltrate.map((c) => {
                  const colore = coloreDi(c.nome, c.colore);
                  const attiva = c.id === value;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onChange(c.id);
                        chiudi();
                      }}
                      style={{
                        backgroundColor: `color-mix(in srgb, ${colore} ${attiva ? 28 : 14}%, transparent)`,
                        borderColor: attiva ? colore : "transparent",
                      }}
                      className="flex items-center justify-between rounded-xl border-2 px-3 py-3 text-left text-[17px] font-medium transition-all duration-150 ease-out active:scale-[0.99]"
                      aria-pressed={attiva}
                    >
                      <span className="truncate">{c.nome}</span>
                      {attiva && <Check className="h-4 w-4 shrink-0" />}
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
