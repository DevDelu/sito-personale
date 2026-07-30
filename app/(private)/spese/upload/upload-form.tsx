"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type UploadResult = {
  insertedSpese: number;
  insertedDepositi: number;
  skippedDuplicates: number;
  skippedIgnored: number;
  skippedInvalidRows: number[];
  totaleSettimanaCorrente: number;
  totaleSettimanaPrecedente: number;
};

const SOURCES = [
  {
    id: "generico",
    label: "CSV generico",
    accept: ".csv,text/csv",
    hint: "Colonne attese: importo, data, descrizione (opzionale), categoria (opzionale).",
  },
  {
    id: "crypto",
    label: "Crypto.com",
    accept: ".csv,text/csv",
    hint: "Export CSV standard di Crypto.com. Depositi EUR e rimborsi vengono esclusi automaticamente.",
  },
  {
    id: "intesa",
    label: "Intesa Sanpaolo",
    accept: ".xlsx",
    hint: "Export Excel \"Lista Operazione\". Giroconti e bonifici verso te stesso vengono esclusi automaticamente.",
  },
] as const;

export function UploadForm() {
  const router = useRouter();
  const [source, setSource] = useState<(typeof SOURCES)[number]["id"]>("generico");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const sourceConfig = SOURCES.find((s) => s.id === source)!;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (!file) {
      setError("Seleziona un file.");
      return;
    }

    setPending(true);
    setError(null);
    setResult(null);

    try {
      const body = new FormData();
      body.append("file", file);
      body.append("source", source);

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
      <div className="flex flex-wrap gap-2">
        {SOURCES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setSource(s.id);
              setResult(null);
              setError(null);
            }}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              source === s.id
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border text-muted hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="file" className="text-sm font-medium text-muted">
            File ({sourceConfig.label})
          </label>
          <input
            key={source}
            id="file"
            name="file"
            type="file"
            accept={sourceConfig.accept}
            required
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent-foreground"
          />
          <p className="text-xs text-muted">{sourceConfig.hint}</p>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Caricamento in corso..." : "Carica file"}
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
            <span className="font-medium">{result.insertedSpese}</span> spese e{" "}
            <span className="font-medium">{result.insertedDepositi}</span> depositi inseriti,{" "}
            <span className="font-medium">{result.skippedDuplicates}</span> duplicati saltati.
          </p>
          {result.skippedIgnored > 0 && (
            <p className="text-muted">
              {result.skippedIgnored} righe escluse per regole di business (es. giroconti,
              rimborsi, depositi EUR, bonifici verso te stesso).
            </p>
          )}
          {result.skippedInvalidRows.length > 0 && (
            <p className="text-muted">
              Righe non valide (numero riga nel file): {result.skippedInvalidRows.join(", ")}
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
