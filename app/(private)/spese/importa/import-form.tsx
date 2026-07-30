"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CategoryBadge } from "@/components/category-badge";
import { formatCurrency } from "@/lib/spese-utils";
import type { ImportRowError } from "@/lib/parsers/import-excel";
import type { PreviewRow } from "@/lib/spese/dedup";

type Stato = "idle" | "parsing" | "preview" | "importing" | "done";

export function ImportForm() {
  const router = useRouter();
  const [stato, setStato] = useState<Stato>("idle");
  const [righe, setRighe] = useState<PreviewRow[]>([]);
  const [selezionate, setSelezionate] = useState<boolean[]>([]);
  const [errori, setErrori] = useState<ImportRowError[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [risultato, setRisultato] = useState<{ insertedSpese: number; insertedDepositi: number } | null>(null);

  const duplicati = righe.filter((r) => r.duplicato).length;
  const numeroSelezionate = selezionate.filter(Boolean).length;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStato("parsing");
    setError(null);
    setRighe([]);
    setErrori([]);
    setRisultato(null);

    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/spese/importa/parse", { method: "POST", body });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Errore durante la lettura del file.");
        setStato("idle");
        return;
      }

      const nuoveRighe: PreviewRow[] = json.righe;
      setRighe(nuoveRighe);
      setSelezionate(nuoveRighe.map((r) => !r.duplicato));
      setErrori(json.errori);
      setStato("preview");
    } catch {
      setError("Errore di rete durante la lettura del file.");
      setStato("idle");
    } finally {
      e.target.value = "";
    }
  }

  async function handleConferma() {
    setStato("importing");
    setError(null);
    try {
      const righeSelezionate = righe.filter((_, i) => selezionate[i]);
      const res = await fetch("/api/spese/importa/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ righe: righeSelezionate }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Errore durante l'importazione.");
        setStato("preview");
        return;
      }
      setRisultato(json);
      setStato("done");
      router.refresh();
    } catch {
      setError("Errore di rete durante l'importazione.");
      setStato("preview");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-muted">File Excel (.xlsx)</label>
        <input
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
          disabled={stato === "parsing" || stato === "importing"}
          className="w-fit rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent-foreground"
        />
        <p className="text-xs text-muted">
          Colonne attese, in ordine: tipo, data, importo, categoria, titolo, descrizione,
          nominativo, dettaglio, fonte.
        </p>
      </div>

      {stato === "parsing" && <p className="text-sm text-muted">Lettura del file in corso...</p>}

      {error && (
        <p className="rounded-xl border border-spesa/30 bg-spesa/10 px-3 py-2 text-sm text-spesa" role="alert">
          {error}
        </p>
      )}

      {(stato === "preview" || stato === "importing") && (
        <>
          {errori.length > 0 && (
            <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
              <p className="mb-1 font-medium text-accent">
                {errori.length} riga/e da correggere (non importate):
              </p>
              <ul className="list-inside list-disc text-muted">
                {errori.map((e) => (
                  <li key={e.riga}>
                    Riga {e.riga}: {e.messaggio}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">
              {righe.length} riga/e valide
              {duplicati > 0 && (
                <>
                  {" "}
                  ({duplicati} già presenti, deselezionate di default)
                </>
              )}
              . {numeroSelezionate} selezionate per l&apos;import.
            </p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-muted">
                  <tr>
                    <th className="px-3 py-2" />
                    <th className="px-3 py-2 font-medium">Tipo</th>
                    <th className="px-3 py-2 font-medium">Data</th>
                    <th className="px-3 py-2 font-medium">Titolo</th>
                    <th className="px-3 py-2 font-medium">Categoria</th>
                    <th className="px-3 py-2 text-right font-medium">Importo</th>
                  </tr>
                </thead>
                <tbody>
                  {righe.map((r, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selezionate[i] ?? false}
                          onChange={(e) =>
                            setSelezionate((prev) => {
                              const next = [...prev];
                              next[i] = e.target.checked;
                              return next;
                            })
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-muted capitalize">{r.tipo}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-muted">
                        {new Date(`${r.data}T00:00:00Z`).toLocaleDateString("it-IT")}
                      </td>
                      <td className="px-3 py-2">
                        <span>{r.titolo}</span>
                        {r.duplicato && (
                          <span className="ml-2 inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs text-accent">
                            già presente
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <CategoryBadge nome={r.categoria} />
                      </td>
                      <td className="px-3 py-2 text-right font-figures">
                        {formatCurrency(r.importo)}
                      </td>
                    </tr>
                  ))}
                  {righe.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-muted">
                        Nessuna riga valida in questo file.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {righe.length > 0 && (
              <button
                type="button"
                onClick={handleConferma}
                disabled={stato === "importing" || numeroSelezionate === 0}
                className="self-start rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {stato === "importing"
                  ? "Importazione in corso..."
                  : `Conferma e importa (${numeroSelezionate})`}
              </button>
            )}
          </div>
        </>
      )}

      {stato === "done" && risultato && (
        <div className="rounded-xl border border-entrata/30 bg-entrata/10 px-4 py-3 text-sm">
          <p className="font-medium text-entrata">
            Importate {risultato.insertedSpese} spese e {risultato.insertedDepositi} entrate.
          </p>
        </div>
      )}
    </div>
  );
}
