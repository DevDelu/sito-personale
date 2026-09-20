"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { aggiungiMovimento, type AggiungiMovimentoState } from "../actions";
import { CategoriaPickerSheet } from "@/components/spese/CategoriaPickerSheet";
import type { Categoria } from "@/lib/types";

const oggi = () => new Date().toISOString().slice(0, 10);

export function AddTransactionForm({
  categorie,
  formId,
}: {
  categorie: Categoria[];
  formId?: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<AggiungiMovimentoState, FormData>(
    aggiungiMovimento,
    undefined
  );
  const [tipo, setTipo] = useState<"spesa" | "entrata">("spesa");
  const [categoriaId, setCategoriaId] = useState("");
  const [categorieList, setCategorieList] = useState(categorie);

  function handleCategoriaCreata(nuova: Categoria) {
    setCategorieList((prev) =>
      prev.some((c) => c.id === nuova.id)
        ? prev
        : [...prev, nuova].sort((a, b) => a.nome.localeCompare(b.nome))
    );
  }

  const categoriaSelezionata = categorieList.find((c) => c.id === categoriaId);
  const mostraNominativo = categoriaSelezionata?.nome === "Bonifici";
  const mostraDettaglio = categoriaSelezionata?.nome === "PayPal";

  return (
    <form id={formId} action={formAction} className="flex w-full max-w-lg animate-slide-up flex-col gap-4">
      <div className="flex gap-2">
        {(["spesa", "entrata"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTipo(t);
              setCategoriaId("");
            }}
            className={`flex-1 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ease-out active:scale-95 ${
              tipo === t
                ? "border-accent bg-accent text-accent-foreground shadow-sm"
                : "border-border text-muted hover:-translate-y-0.5 hover:text-foreground"
            }`}
          >
            {t === "spesa" ? "Spesa" : "Entrata"}
          </button>
        ))}
      </div>
      <input type="hidden" name="tipo" value={tipo} />

      {/* Su mobile l'importo è il campo più prominente, in cima: dimensione
          da titolo, tastiera numerica. Su desktop resta di taglia normale,
          affiancato alla data come prima. */}
      <Field label="Importo (€)">
        <input
          name="importo"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          required
          autoFocus
          className="field-input bg-surface text-center text-[32px] font-bold max-md:py-4 md:text-left md:text-base md:font-normal"
        />
      </Field>

      <Field label="Titolo">
        <input
          name="titolo"
          type="text"
          required
          className="field-input bg-surface"
        />
      </Field>

      <Field label="Data">
        <input
          name="data"
          type="date"
          required
          defaultValue={oggi()}
          className="field-input bg-surface"
        />
      </Field>

      <Field label="Categoria">
        <CategoriaPickerSheet
          categorie={categorieList}
          tipo={tipo}
          value={categoriaId}
          onChange={setCategoriaId}
          onCategoriaCreata={handleCategoriaCreata}
          name="categoria_id"
        />
      </Field>

      {mostraNominativo && (
        <div className="animate-slide-down">
          <Field label="Nominativo">
            <input name="nominativo" type="text" className="field-input bg-surface" />
          </Field>
        </div>
      )}

      {mostraDettaglio && (
        <div className="animate-slide-down">
          <Field label="Beneficiario / dettaglio">
            <input name="dettaglio" type="text" className="field-input bg-surface" />
          </Field>
        </div>
      )}

      <Field label="Descrizione (opzionale)">
        <textarea
          name="descrizione"
          rows={2}
          className="field-input bg-surface"
        />
      </Field>

      {state?.error && (
        <p className="text-sm text-spesa" role="alert">
          {state.error}
        </p>
      )}

      {/* Su mobile il salvataggio avviene dal pulsante nella PageHeader
          (sempre visibile, la tastiera non lo copre): qui resta solo il
          feedback di caricamento. Su desktop, senza header d'azione, i
          pulsanti restano qui come prima. */}
      {pending && (
        <p className="text-sm text-muted md:hidden" role="status">
          Salvataggio...
        </p>
      )}
      <div className="hidden gap-3 md:flex">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Salvataggio..." : "Aggiungi"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Annulla
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-sm font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
