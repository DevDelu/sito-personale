"use client";

import type { ReactNode } from "react";
import type { Categoria, TipoCategoria } from "@/lib/types";
import type { useMovimentoForm } from "@/hooks/useMovimentoForm";
import { CategoriaSelector } from "./CategoriaSelector";

export function MovimentoFormFields({
  form,
  categorie,
  tipo,
  onCategoriaCreata,
}: {
  form: ReturnType<typeof useMovimentoForm>;
  categorie: Categoria[];
  tipo: TipoCategoria;
  onCategoriaCreata?: (categoria: Categoria) => void;
}) {
  return (
    <>
      <Field label="Titolo">
        <input
          value={form.titolo}
          onChange={(e) => form.setTitolo(e.target.value)}
          required
          className="rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Importo (€)">
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={form.importo}
            onChange={(e) => form.setImporto(e.target.value)}
            required
            className="rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
          />
        </Field>
        <Field label="Data">
          <input
            type="date"
            value={form.data}
            onChange={(e) => form.setData(e.target.value)}
            required
            className="rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
          />
        </Field>
      </div>

      <Field label="Categoria">
        <CategoriaSelector
          categorie={categorie}
          tipo={tipo}
          value={form.categoriaId}
          onChange={form.setCategoriaId}
          onCategoriaCreata={onCategoriaCreata}
        />
      </Field>

      {form.mostraNominativo && (
        <Field label="Nominativo">
          <input
            value={form.nominativo}
            onChange={(e) => form.setNominativo(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
          />
        </Field>
      )}

      {form.mostraDettaglio && (
        <Field label="Beneficiario / dettaglio">
          <input
            value={form.dettaglio}
            onChange={(e) => form.setDettaglio(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
          />
        </Field>
      )}

      <Field label="Descrizione (opzionale)">
        <textarea
          value={form.descrizione}
          onChange={(e) => form.setDescrizione(e.target.value)}
          rows={2}
          className="rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
        />
      </Field>
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
