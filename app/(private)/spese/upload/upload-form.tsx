"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type UploadResult = {
  inserted: number;
  skippedDuplicates: number;
  skippedInvalidRows: number[];
  totaleSettimanaCorrente: number;
  totaleSettimanaPrecedente: number;
};

export function UploadForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (!file) {
      setError("Seleziona un file CSV.");
      return;
    }

    setPending(true);
    setError(null);
    setResult(null);

    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/spese/upload", { method: "POST", body });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Errore durante il caricamento.");
        return;
      }

      setResult(json);
      form.reset();
      router.refresh();
    } catch {
      setError("Errore di rete durante il caricamento.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="file" className="text-sm font-medium text-muted">
            File CSV
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".csv,text/csv"
            required
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent-foreground"
          />
          <p className="text-xs text-muted">
            Colonne attese: importo, data, descrizione (opzionale), categoria (opzionale).
          </p>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Caricamento in corso..." : "Carica CSV"}
        </button>
      </form>

      {error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface px-4 py-3 text-sm">
          <p>
            <span className="font-medium">{result.inserted}</span> righe inserite,{" "}
            <span className="font-medium">{result.skippedDuplicates}</span> duplicati saltati.
          </p>
          {result.skippedInvalidRows.length > 0 && (
            <p className="text-muted">
              Righe non valide (numero riga nel CSV): {result.skippedInvalidRows.join(", ")}
            </p>
          )}
          <p className="text-muted">
            Totale settimana corrente: {result.totaleSettimanaCorrente.toFixed(2)} € · settimana
            precedente: {result.totaleSettimanaPrecedente.toFixed(2)} €
          </p>
        </div>
      )}
    </div>
  );
}
