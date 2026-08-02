"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCurrency, formatQuantita } from "@/lib/investimenti/format";
import type { ImportRowError, ImportRowInvestimenti } from "@/lib/investimenti/import-excel";

type PreviewRow = ImportRowInvestimenti & { asset_id: string; asset_nome: string };
type Stato = "idle" | "parsing" | "preview" | "importing" | "done";

export function ImportForm() {
  const router = useRouter();
  const [stato, setStato] = useState<Stato>("idle");
  const [righe, setRighe] = useState<PreviewRow[]>([]);
  const [selezionate, setSelezionate] = useState<boolean[]>([]);
  const [errori, setErrori] = useState<ImportRowError[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [risultato, setRisultato] = useState<{ inserted: number } | null>(null);

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
      const res = await fetch("/api/investimenti/importa/parse", { method: "POST", body });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Errore durante la lettura del file.");
        setStato("idle");
        return;
      }

      const nuoveRighe: PreviewRow[] = json.righe;
      setRighe(nuoveRighe);
      setSelezionate(nuoveRighe.map(() => true));
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
      const res = await fetch("/api/investimenti/importa/confirm", {
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
          className="w-fit rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground transition-all duration-150 file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent-foreground file:transition-opacity hover:file:opacity-90"
        />
        <p className="text-xs text-muted">
          Formato atteso: export Fineco &ldquo;Movimenti Dossier Titoli&rdquo; (.xlsx), così com&apos;è
          scaricato dal sito, senza modifiche. L&apos;Isin di ogni riga deve corrispondere a un asset
          già esistente in Gestione; le transazioni importate sono sempre segnate come
          &ldquo;verificato&rdquo;.
        </p>
      </div>

      {stato === "parsing" && (
        <p className="flex animate-fade-in items-center gap-2 text-sm text-muted">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted border-t-accent" />
          Lettura del file in corso...
        </p>
      )}

      {error && (
        <p
          className="animate-slide-down rounded-xl border border-spesa/30 bg-spesa/10 px-3 py-2 text-sm text-spesa"
          role="alert"
        >
          {error}
        </p>
      )}

      {(stato === "preview" || stato === "importing") && (
        <div className="flex animate-fade-in flex-col gap-3">
          {errori.length > 0 && (
            <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
              <p className="mb-1 font-medium text-accent">
                {errori.length} riga/e da correggere (non importate):
              </p>
              <ul className="list-inside list-disc text-muted">
                {errori.map((e, i) => (
                  <li key={i}>
                    Riga {e.riga}: {e.messaggio}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">
              {righe.length} riga/e valide. {numeroSelezionate} selezionate per l&apos;import.
            </p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-muted">
                  <tr>
                    <th className="px-3 py-2" />
                    <th className="px-3 py-2 font-medium">Data</th>
                    <th className="px-3 py-2 font-medium">Asset</th>
                    <th className="px-3 py-2 font-medium">Tipo</th>
                    <th className="px-3 py-2 text-right font-medium">Quantità</th>
                    <th className="px-3 py-2 text-right font-medium">Prezzo</th>
                  </tr>
                </thead>
                <tbody>
                  {righe.map((r, i) => (
                    <tr
                      key={i}
                      className="border-b border-border transition-colors duration-150 last:border-0 hover:bg-surface-hover"
                    >
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
                          className="h-4 w-4 rounded border-border accent-[var(--accent)] transition-transform active:scale-90"
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-muted">
                        {new Date(`${r.data}T00:00:00Z`).toLocaleDateString("it-IT")}
                      </td>
                      <td className="px-3 py-2">{r.asset_nome}</td>
                      <td className="px-3 py-2 text-muted">{r.tipo === "buy" ? "Acquisto" : "Vendita"}</td>
                      <td className="px-3 py-2 text-right font-figures">{formatQuantita(r.quantita)}</td>
                      <td className="px-3 py-2 text-right font-figures">
                        {r.prezzo_unitario === null ? "n/d" : formatCurrency(r.prezzo_unitario)}
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
                className="btn-primary self-start"
              >
                {stato === "importing"
                  ? "Importazione in corso..."
                  : `Conferma e importa (${numeroSelezionate})`}
              </button>
            )}
          </div>
        </div>
      )}

      {stato === "done" && risultato && (
        <div className="animate-pop-in rounded-xl border border-entrata/30 bg-entrata/10 px-4 py-3 text-sm">
          <p className="font-medium text-entrata">Importate {risultato.inserted} transazioni.</p>
        </div>
      )}
    </div>
  );
}
