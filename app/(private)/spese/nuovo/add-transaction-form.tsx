"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { aggiungiMovimento, type AggiungiMovimentoState } from "../actions";
import type { Categoria } from "@/lib/types";

const oggi = () => new Date().toISOString().slice(0, 10);

export function AddTransactionForm({ categorie }: { categorie: Categoria[] }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<AggiungiMovimentoState, FormData>(
    aggiungiMovimento,
    undefined
  );
  const [tipo, setTipo] = useState<"spesa" | "entrata">("spesa");
  const [categoriaId, setCategoriaId] = useState("");

  const categorieFiltrate = useMemo(
    () => categorie.filter((c) => c.tipo === tipo),
    [categorie, tipo]
  );

  const categoriaSelezionata = categorie.find((c) => c.id === categoriaId);
  const mostraNominativo = categoriaSelezionata?.nome === "Bonifici";
  const mostraDettaglio = categoriaSelezionata?.nome === "PayPal";

  return (
    <form action={formAction} className="flex w-full max-w-lg flex-col gap-4">
      <div className="flex gap-2">
        {(["spesa", "entrata"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTipo(t);
              setCategoriaId("");
            }}
            className={`flex-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              tipo === t
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border text-muted hover:text-foreground"
            }`}
          >
            {t === "spesa" ? "Spesa" : "Entrata"}
          </button>
        ))}
      </div>
      <input type="hidden" name="tipo" value={tipo} />

      <Field label="Titolo">
        <input
          name="titolo"
          type="text"
          required
          className="rounded-xl border border-border bg-surface px-3 py-2 text-foreground outline-none focus:border-accent"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Importo (€)">
          <input
            name="importo"
            type="number"
            step="0.01"
            min="0.01"
            required
            className="rounded-xl border border-border bg-surface px-3 py-2 text-foreground outline-none focus:border-accent"
          />
        </Field>
        <Field label="Data">
          <input
            name="data"
            type="date"
            required
            defaultValue={oggi()}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-foreground outline-none focus:border-accent"
          />
        </Field>
      </div>

      <Field label="Categoria">
        <select
          name="categoria_id"
          required
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-foreground outline-none focus:border-accent"
        >
          <option value="" disabled>
            Seleziona categoria
          </option>
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
            name="nominativo"
            type="text"
            className="rounded-xl border border-border bg-surface px-3 py-2 text-foreground outline-none focus:border-accent"
          />
        </Field>
      )}

      {mostraDettaglio && (
        <Field label="Beneficiario / dettaglio">
          <input
            name="dettaglio"
            type="text"
            className="rounded-xl border border-border bg-surface px-3 py-2 text-foreground outline-none focus:border-accent"
          />
        </Field>
      )}

      <Field label="Descrizione (opzionale)">
        <textarea
          name="descrizione"
          rows={2}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-foreground outline-none focus:border-accent"
        />
      </Field>

      {state?.error && (
        <p className="text-sm text-spesa" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Salvataggio..." : "Aggiungi"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full border border-border px-4 py-2.5 text-sm text-muted hover:text-foreground"
        >
          Annulla
        </button>
      </div>
    </form>
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
