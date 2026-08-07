"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Download, Trash2 } from "lucide-react";
import { useStoricoMutations } from "@/hooks/useStoricoMutations";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { BulkEditSessioniModal } from "./BulkEditSessioniModal";
import type { BulkSessionePatch } from "@/app/(private)/allenamenti/actions";
import type { Sessione } from "@/lib/allenamento/types";

const SENSAZIONE_LABEL = ["😞", "🙁", "😐", "🙂", "💪"];

function formatData(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Nessun export CSV preesistente nel modulo Spese da riusare (verificato:
// non c'è in repo), quindi è un'implementazione autonoma — download via
// Blob lato client, pattern standard, nessuna libreria aggiuntiva.
function esportaCsv(sessioni: Sessione[]) {
  const header = ["Data", "Durata (min)", "Sensazione", "Note"];
  const righe = sessioni.map((s) => [
    s.data,
    s.durata_min != null ? String(s.durata_min) : "",
    s.sensazione != null ? String(s.sensazione) : "",
    s.note ?? "",
  ]);

  const csv = [header, ...righe]
    .map((riga) => riga.map((v) => `"${v.replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `allenamenti-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function SessionsHistoryTable({ sessioni }: { sessioni: Sessione[] }) {
  const router = useRouter();
  const { eliminaSessione, bulkAggiorna, bulkElimina, pending } = useStoricoMutations();
  const [eliminando, setEliminando] = useState<Sessione | null>(null);
  const [selezionati, setSelezionati] = useState<Set<string>>(new Set());
  const [modificaBulk, setModificaBulk] = useState(false);
  const [eliminaBulk, setEliminaBulk] = useState(false);

  async function handleElimina() {
    if (!eliminando) return;
    await eliminaSessione(eliminando.id);
    setEliminando(null);
    router.refresh();
  }

  function toggleRiga(id: string) {
    setSelezionati((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleTutte() {
    setSelezionati((prev) => (prev.size === sessioni.length ? new Set() : new Set(sessioni.map((s) => s.id))));
  }

  const idsSelezionati = [...selezionati];

  async function handleBulkApply(patch: BulkSessionePatch) {
    await bulkAggiorna(idsSelezionati, patch);
    setModificaBulk(false);
    setSelezionati(new Set());
    router.refresh();
  }

  async function handleBulkDelete() {
    await bulkElimina(idsSelezionati);
    setEliminaBulk(false);
    setSelezionati(new Set());
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-medium text-muted">Sessioni</h2>
        <button
          type="button"
          onClick={() => esportaCsv(sessioni)}
          disabled={sessioni.length === 0}
          className="btn-secondary flex items-center gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          Esporta CSV
        </button>
      </div>

      {idsSelezionati.length > 0 && (
        <div className="animate-slide-down flex flex-wrap items-center gap-3 rounded-xl border border-accent/40 bg-accent/10 px-4 py-2.5 shadow-sm">
          <span className="text-sm font-medium">
            {idsSelezionati.length} {idsSelezionati.length === 1 ? "selezionata" : "selezionate"}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => setModificaBulk(true)} className="btn-primary !px-3 !py-1.5">
              Modifica in blocco
            </button>
            <button
              type="button"
              onClick={() => setEliminaBulk(true)}
              className="btn-secondary !px-3 !py-1.5 hover:!text-spesa"
            >
              Elimina selezionate
            </button>
            <button type="button" onClick={() => setSelezionati(new Set())} className="btn-secondary !px-3 !py-1.5">
              Deseleziona
            </button>
          </div>
        </div>
      )}

      {sessioni.length === 0 ? (
        <div className="card flex items-center justify-center p-6">
          <p className="text-sm text-muted">Nessuna sessione registrata ancora.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="w-8 px-4 py-2">
                  <input
                    type="checkbox"
                    aria-label="Seleziona tutte"
                    checked={sessioni.length > 0 && selezionati.size === sessioni.length}
                    onChange={toggleTutte}
                    className="h-4 w-4 rounded border-border accent-[var(--accent)] transition-transform active:scale-90"
                  />
                </th>
                <th className="px-4 py-2 font-medium">Data</th>
                <th className="px-4 py-2 font-medium">Durata</th>
                <th className="px-4 py-2 font-medium">Sensazione</th>
                <th className="px-4 py-2 font-medium">Note</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {sessioni.map((s) => {
                const selezionata = selezionati.has(s.id);
                return (
                  <tr
                    key={s.id}
                    className={`border-b border-border transition-colors duration-150 last:border-0 ${
                      selezionata ? "bg-accent/5" : ""
                    }`}
                  >
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        aria-label="Seleziona sessione"
                        checked={selezionata}
                        onChange={() => toggleRiga(s.id)}
                        className="h-4 w-4 rounded border-border accent-[var(--accent)] transition-transform active:scale-90"
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap capitalize">
                      <Link href={`/allenamenti/storico/${s.id}`} className="hover:text-accent hover:underline">
                        {formatData(s.data)}
                      </Link>
                    </td>
                    <td className="font-figures px-4 py-2 whitespace-nowrap">
                      {s.durata_min != null ? `${s.durata_min} min` : "—"}
                    </td>
                    <td className="px-4 py-2">{s.sensazione != null ? SENSAZIONE_LABEL[s.sensazione - 1] : "—"}</td>
                    <td className="max-w-xs truncate px-4 py-2 text-muted">{s.note ?? "—"}</td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => setEliminando(s)}
                        aria-label="Elimina sessione"
                        className="btn-icon hover:!text-spesa"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {eliminando && (
        <DeleteConfirmDialog
          titolo={formatData(eliminando.data)}
          title="Eliminare questa sessione?"
          description="Tutte le serie registrate in questa sessione verranno rimosse definitivamente. L'operazione non è reversibile."
          pending={pending}
          onConfirm={handleElimina}
          onCancel={() => setEliminando(null)}
        />
      )}

      {modificaBulk && (
        <BulkEditSessioniModal
          count={idsSelezionati.length}
          pending={pending}
          error={null}
          onApply={handleBulkApply}
          onCancel={() => setModificaBulk(false)}
        />
      )}

      {eliminaBulk && (
        <DeleteConfirmDialog
          titolo="sessioni selezionate"
          count={idsSelezionati.length}
          pending={pending}
          onConfirm={handleBulkDelete}
          onCancel={() => setEliminaBulk(false)}
        />
      )}
    </div>
  );
}
