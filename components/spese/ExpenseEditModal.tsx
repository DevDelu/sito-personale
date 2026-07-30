"use client";

import { useMemo, useState } from "react";
import type { Categoria, Movimento } from "@/lib/types";
import type { MovimentoPatch } from "@/hooks/useExpenseMutations";

export function ExpenseEditModal({
  movimento,
  categorie,
  pending,
  error,
  onSave,
  onCancel,
}: {
  movimento: Movimento;
  categorie: Categoria[];
  pending: boolean;
  error: string | null;
  onSave: (patch: MovimentoPatch) => void;
  onCancel: () => void;
}) {
  const [titolo, setTitolo] = useState(movimento.titolo ?? "");
  const [importo, setImporto] = useState(String(movimento.importo));
  const [data, setData] = useState(movimento.data);
  const [categoriaId, setCategoriaId] = useState(movimento.categoria_id ?? "");
  const [descrizione, setDescrizione] = useState(movimento.descrizione ?? "");
  const [nominativo, setNominativo] = useState(movimento.nominativo ?? "");
  const [dettaglio, setDettaglio] = useState(movimento.dettaglio ?? "");

  const categorieFiltrate = useMemo(
    () => categorie.filter((c) => c.tipo === movimento.tipo),
    [categorie, movimento.tipo]
  );
  const categoriaSelezionata = categorie.find((c) => c.id === categoriaId);
  const mostraNominativo = categoriaSelezionata?.nome === "Bonifici";
  const mostraDettaglio = categoriaSelezionata?.nome === "PayPal";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const importoNum = Number(importo.replace(",", "."));
    onSave({
      titolo,
      importo: importoNum,
      data,
      categoria_id: categoriaId,
      descrizione: descrizione || null,
      nominativo: mostraNominativo ? nominativo || null : null,
      dettaglio: mostraDettaglio ? dettaglio || null : null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-border bg-surface p-5"
      >
        <h2 className="font-display text-base font-semibold">Modifica movimento</h2>

        <Field label="Titolo">
          <input
            value={titolo}
            onChange={(e) => setTitolo(e.target.value)}
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
              value={importo}
              onChange={(e) => setImporto(e.target.value)}
              required
              className="rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
            />
          </Field>
          <Field label="Data">
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              required
              className="rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
            />
          </Field>
        </div>

        <Field label="Categoria">
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            required
            className="rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
          >
            {categorieFiltrate.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </Field>

        {mostraNominativo && (
          <Field label="Nominativo">
            <input
              value={nominativo}
              onChange={(e) => setNominativo(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
            />
          </Field>
        )}

        {mostraDettaglio && (
          <Field label="Beneficiario / dettaglio">
            <input
              value={dettaglio}
              onChange={(e) => setDettaglio(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
            />
          </Field>
        )}

        <Field label="Descrizione (opzionale)">
          <textarea
            value={descrizione}
            onChange={(e) => setDescrizione(e.target.value)}
            rows={2}
            className="rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
          />
        </Field>

        {error && (
          <p className="text-sm text-spesa" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Salvataggio..." : "Salva"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
