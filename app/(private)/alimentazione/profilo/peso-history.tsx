"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import type { PesoCorporeo } from "@/lib/alimentazione/types";
import { mostraToast } from "@/lib/toast/bus";

// Storico completo, non solo l'ultimo valore (richiesto esplicitamente per
// questa pagina): su desktop la lista resta scrollabile, su telefono scorre con la
// pagina (niente scroll annidato).
function formatData(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

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
      mostraToast({ testo: "Peso eliminato" });
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
      <ul className="card flex flex-col divide-y divide-border md:max-h-80 md:overflow-y-auto">
        {righe.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex flex-col gap-0.5">
              <span className="font-figures text-sm font-medium max-md:text-[17px]">{p.peso_kg} kg</span>
              <span className="text-xs text-muted max-md:text-[13px]">
                {formatData(p.data)}
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
          titolo={`${deleting.peso_kg} kg (${formatData(deleting.data)})`}
          pending={pending}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          title="Eliminare questo peso?"
        />
      )}
    </>
  );
}
