"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CategoryBadge } from "@/components/category-badge";
import { formatCurrency } from "@/lib/spese-utils";
import type { ImportRowError, ImportRow } from "@/lib/parsers/import-excel";
import type { ExclusedRow } from "@/lib/categorization/apply";
import type { Categoria } from "@/lib/types";

type Stato = "idle" | "parsing" | "preview" | "importing" | "done";
type Modalita = "excel" | "grezzo";

type PreviewRow = ImportRow & {
  duplicato: boolean;
  daVerificare?: boolean;
  categoriaSuggerita?: string | null;
};

export function ImportForm({ categorie }: { categorie: Categoria[] }) {
  const router = useRouter();
  const [modalita, setModalita] = useState<Modalita>("excel");
  const [stato, setStato] = useState<Stato>("idle");
  const [righe, setRighe] = useState<PreviewRow[]>([]);
  const [selezionate, setSelezionate] = useState<boolean[]>([]);
  const [errori, setErrori] = useState<ImportRowError[]>([]);
  const [escluse, setEscluse] = useState<ExclusedRow[]>([]);
  const [mostraEscluse, setMostraEscluse] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [risultato, setRisultato] = useState<{ insertedSpese: number; insertedDepositi: number } | null>(null);

  const [cryptoFile, setCryptoFile] = useState<File | null>(null);
  const [intesaFile, setIntesaFile] = useState<File | null>(null);

  const duplicati = righe.filter((r) => r.duplicato).length;
  const daVerificareCount = righe.filter((r) => r.daVerificare).length;
  const numeroSelezionate = selezionate.filter(Boolean).length;

  function resetPreview() {
    setError(null);
    setRighe([]);
    setSelezionate([]);
    setErrori([]);
    setEscluse([]);
    setRisultato(null);
  }

  function cambiaModalita(m: Modalita) {
    setModalita(m);
    setStato("idle");
    resetPreview();
    setCryptoFile(null);
    setIntesaFile(null);
  }

  async function handleFileChangeExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStato("parsing");
    resetPreview();

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

  async function handleAnalizzaGrezzi() {
    if (!cryptoFile && !intesaFile) return;

    setStato("parsing");
    resetPreview();

    try {
      const body = new FormData();
      if (cryptoFile) body.append("crypto", cryptoFile);
      if (intesaFile) body.append("intesa", intesaFile);
      const res = await fetch("/api/spese/importa/grezzo", { method: "POST", body });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Errore durante la lettura dei file.");
        setStato("idle");
        return;
      }

      const nuoveRighe: PreviewRow[] = json.righe;
      setRighe(nuoveRighe);
      setSelezionate(nuoveRighe.map((r) => !r.duplicato));
      setErrori(json.erroriParsing ?? []);
      setEscluse(json.escluse ?? []);
      setStato("preview");
    } catch {
      setError("Errore di rete durante la lettura dei file.");
      setStato("idle");
    }
  }

  function handleCategoriaChange(index: number, nuovaCategoria: string) {
    setRighe((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], categoria: nuovaCategoria, daVerificare: false };
      return next;
    });
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
      <div className="flex w-fit gap-1 rounded-xl border border-border bg-surface p-1">
        {(["excel", "grezzo"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => cambiaModalita(m)}
            disabled={stato === "parsing" || stato === "importing"}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
              modalita === m ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            {m === "excel" ? "Excel pronto" : "CSV grezzi Crypto + Intesa"}
          </button>
        ))}
      </div>

      {modalita === "excel" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted">File Excel (.xlsx)</label>
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileChangeExcel}
            disabled={stato === "parsing" || stato === "importing"}
            className="w-fit rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground transition-all duration-150 file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent-foreground file:transition-opacity hover:file:opacity-90"
          />
          <p className="text-xs text-muted">
            Colonne attese, in ordine: tipo, data, importo, categoria, titolo, descrizione,
            nominativo, dettaglio, fonte.
          </p>
        </div>
      )}

      {modalita === "grezzo" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted">Crypto.com (.csv)</label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCryptoFile(e.target.files?.[0] ?? null)}
                disabled={stato === "parsing" || stato === "importing"}
                className="w-fit rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground transition-all duration-150 file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent-foreground file:transition-opacity hover:file:opacity-90"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted">Intesa Sanpaolo (.xlsx)</label>
              <input
                type="file"
                accept=".xlsx"
                onChange={(e) => setIntesaFile(e.target.files?.[0] ?? null)}
                disabled={stato === "parsing" || stato === "importing"}
                className="w-fit rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground transition-all duration-150 file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent-foreground file:transition-opacity hover:file:opacity-90"
              />
            </div>
          </div>
          <p className="text-xs text-muted">
            Almeno uno dei due file è obbligatorio. Categorizzazione automatica in locale, nessuna
            chiamata esterna.
          </p>
          <button
            type="button"
            onClick={handleAnalizzaGrezzi}
            disabled={(!cryptoFile && !intesaFile) || stato === "parsing" || stato === "importing"}
            className="btn-primary self-start"
          >
            {stato === "parsing" ? "Analisi in corso..." : "Analizza file"}
          </button>
        </div>
      )}

      {stato === "parsing" && (
        <p className="flex animate-fade-in items-center gap-2 text-sm text-muted">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted border-t-accent" />
          Lettura in corso...
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
              {righe.length} riga/e valide
              {duplicati > 0 && <> ({duplicati} già presenti, deselezionate di default)</>}
              {daVerificareCount > 0 && <> — {daVerificareCount} da verificare</>}. {numeroSelezionate}{" "}
              selezionate per l&apos;import.
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
                        {r.daVerificare && (
                          <span className="ml-2 inline-flex items-center rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-600 dark:text-yellow-400">
                            da verificare
                            {r.categoriaSuggerita ? ` (banca: ${r.categoriaSuggerita})` : ""}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {r.daVerificare ? (
                          <select
                            value={r.categoria}
                            onChange={(e) => handleCategoriaChange(i, e.target.value)}
                            className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground outline-none transition-all duration-150 focus:border-accent"
                          >
                            {categorie
                              .filter((c) => c.tipo === r.tipo)
                              .map((c) => (
                                <option key={c.id} value={c.nome}>
                                  {c.nome}
                                </option>
                              ))}
                          </select>
                        ) : (
                          <CategoryBadge nome={r.categoria} />
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-figures">{formatCurrency(r.importo)}</td>
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

            {escluse.length > 0 && (
              <div className="rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setMostraEscluse((v) => !v)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-foreground"
                >
                  Movimenti esclusi ({escluse.length})
                  <span className="text-muted">{mostraEscluse ? "−" : "+"}</span>
                </button>
                {mostraEscluse && (
                  <div className="animate-slide-down border-t border-border">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-border text-muted">
                        <tr>
                          <th className="px-3 py-2 font-medium">Data</th>
                          <th className="px-3 py-2 font-medium">Descrizione</th>
                          <th className="px-3 py-2 text-right font-medium">Importo</th>
                          <th className="px-3 py-2 font-medium">Motivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {escluse.map((ex, i) => (
                          <tr key={i} className="border-b border-border last:border-0">
                            <td className="px-3 py-2 whitespace-nowrap text-muted">
                              {new Date(`${ex.raw.data}T00:00:00Z`).toLocaleDateString("it-IT")}
                            </td>
                            <td className="px-3 py-2">{ex.raw.descrizioneGrezza}</td>
                            <td className="px-3 py-2 text-right font-figures text-muted">
                              {formatCurrency(ex.raw.importo)}
                            </td>
                            <td className="px-3 py-2 text-xs text-muted">{ex.motivoRegolaId}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

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
          <p className="font-medium text-entrata">
            Importate {risultato.insertedSpese} spese e {risultato.insertedDepositi} entrate.
          </p>
        </div>
      )}
    </div>
  );
}
