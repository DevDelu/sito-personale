"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import type { PesoCorporeo } from "@/lib/alimentazione/types";

// Storico completo, non solo l'ultimo valore (richiesto esplicitamente per
// questa pagina): la lista resta scrollabile invece di comprimere la
// pagina se il log cresce nel tempo.
export function PesoHistory({ righe }: { righe: PesoCorporeo[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<PesoCorporeo | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!deleting) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/alimentazione/peso/${deleting.id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Errore durante l'eliminazione.");
      setDeleting(null);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  if (righe.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 p-6 text-center text-sm text-muted">
        Nessun peso registrato ancora.
      </div>
    );
  }

  return (
    <>
      <ul className="card flex max-h-80 flex-col divide-y divide-border overflow-y-auto">
        {righe.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex flex-col gap-0.5">
              <span className="font-figures text-sm font-medium">{p.peso_kg} kg</span>
              <span className="text-xs text-muted">
                {p.data}
                {p.note ? ` · ${p.note}` : ""}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDeleting(p)}
              aria-label="Elimina peso"
              className="btn-icon"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      {error && (
        <p className="text-sm text-spesa" role="alert">
          {error}
        </p>
      )}
      {deleting && (
        <DeleteConfirmDialog
          titolo={`${deleting.peso_kg} kg (${deleting.data})`}
          pending={pending}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          title="Eliminare questo peso?"
        />
      )}
    </>
  );
}
