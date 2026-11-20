"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { usePastoMutations, type PastoPatch } from "@/hooks/usePastoMutations";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { ListGroup, ListRowButton } from "@/components/ui/ListGroup";
import { PastoEditModal } from "./PastoEditModal";
import type { Pasto } from "@/lib/alimentazione/types";
import { mostraToast } from "@/lib/toast/bus";
import { creaAzioniDifferite, RITARDO_ANNULLA_MS } from "@/lib/toast/azione-differita";

const LABEL_TIPO: Record<string, string> = {
  colazione: "Colazione",
  pranzo: "Pranzo",
  cena: "Cena",
  spuntino: "Spuntino",
};

export function PastoTable({ rows: righeServer }: { rows: Pasto[] }) {
  const router = useRouter();
  // Eliminazione annullabile: la riga sparisce subito, la DELETE parte dopo 5 s.
  const [nascosti, setNascosti] = useState<Set<string>>(new Set());
  const rows = useMemo(
    () => (nascosti.size ? righeServer.filter((p) => !nascosti.has(p.id)) : righeServer),
    [righeServer, nascosti]
  );
  const [differite] = useState(() => creaAzioniDifferite());
  useEffect(() => {
    const vaiOra = () => differite.eseguiTutte();
    window.addEventListener("pagehide", vaiOra);
    return () => {
      window.removeEventListener("pagehide", vaiOra);
      vaiOra();
    };
  }, [differite]);
  const { updatePasto, deletePasto, pending, error } = usePastoMutations();
  const [editing, setEditing] = useState<Pasto | null>(null);
  const [deleting, setDeleting] = useState<Pasto | null>(null);

  async function handleSave(patch: PastoPatch) {
    if (!editing) return;
    await updatePasto(editing.id, patch);
    setEditing(null);
    router.refresh();
    mostraToast({ testo: "Pasto aggiornato" });
  }

  function mostraRiga(id: string) {
    setNascosti((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function handleDelete() {
    if (!deleting) return;
    const { id } = deleting;
    setDeleting(null);
    setNascosti((prev) => new Set(prev).add(id));
    differite.pianifica(id, async () => {
      try {
        await deletePasto(id);
        router.refresh();
      } catch {
        mostraRiga(id);
        mostraToast({ testo: "Eliminazione non riuscita" });
      }
    });
    mostraToast({
      testo: "Pasto eliminato",
      durataMs: RITARDO_ANNULLA_MS,
      azione: {
        etichetta: "Annulla",
        onClick: () => {
          differite.annulla(id);
          mostraRiga(id);
        },
      },
    });
  }

  if (rows.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 p-8 text-center text-sm text-muted">
        Nessun pasto trovato per i filtri selezionati.
      </div>
    );
  }

  return (
    <>
      {/* Telefono: lista a righe (tap = modifica, elimina dentro lo sheet), niente scroll orizzontale. */}
      <div className="md:hidden">
        <ListGroup>
          {rows.map((p) => (
            <div key={p.id} data-fb-entita={`pasto:${p.id}`}>
              <ListRowButton
                title={p.alimento_nome}
                subtitle={`${LABEL_TIPO[p.tipo_pasto] ?? p.tipo_pasto} · ${p.data.slice(8, 10)}/${p.data.slice(5, 7)} · ${p.quantita_g}g`}
                value={`${Math.round(p.kcal)} kcal`}
                chevron
                onClick={() => setEditing(p)}
              />
            </div>
          ))}
        </ListGroup>
      </div>

      <div className="card hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Alimento</th>
              <th className="px-4 py-3 text-right font-medium">Quantità</th>
              <th className="px-4 py-3 text-right font-medium">Kcal</th>
              <th className="px-4 py-3 text-right font-medium">P / C / G</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((p) => (
              <tr key={p.id} data-fb-entita={`pasto:${p.id}`} className="transition-colors hover:bg-surface-hover">
                <td className="px-4 py-3 font-figures">{p.data}</td>
                <td className="px-4 py-3">{LABEL_TIPO[p.tipo_pasto] ?? p.tipo_pasto}</td>
                <td className="px-4 py-3">
                  {p.alimento_nome}
                  {p.note && <div className="text-xs text-muted">{p.note}</div>}
                </td>
                <td className="px-4 py-3 text-right font-figures">{p.quantita_g}g</td>
                <td className="px-4 py-3 text-right font-figures">{Math.round(p.kcal)}</td>
                <td className="px-4 py-3 text-right font-figures text-xs text-muted">
                  {Math.round(p.proteine_g)} / {Math.round(p.carboidrati_g)} / {Math.round(p.grassi_g)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(p)}
                      aria-label={`Modifica ${p.alimento_nome}`}
                      className="btn-icon"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(p)}
                      aria-label={`Elimina ${p.alimento_nome}`}
                      className="btn-icon"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <PastoEditModal
          pasto={editing}
          pending={pending}
          error={error}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          onDelete={() => {
            setDeleting(editing);
            setEditing(null);
          }}
        />
      )}

      {deleting && (
        <DeleteConfirmDialog
          titolo={deleting.alimento_nome}
          pending={pending}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          title="Eliminare questo pasto?"
          description={
            <>
              &ldquo;{deleting.alimento_nome}&rdquo; ({deleting.quantita_g}g) verrà rimosso definitivamente.
              L&apos;operazione non è reversibile.
            </>
          }
        />
      )}
    </>
  );
}
