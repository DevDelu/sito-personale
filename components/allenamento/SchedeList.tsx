"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { useSchedeMutations } from "@/hooks/useSchedeMutations";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import type { SchedaConMeta } from "@/lib/allenamento/queries";

function formatUltimoUtilizzo(iso: string | null): string {
  if (!iso) return "Mai usata";
  return `Ultimo utilizzo: ${new Date(`${iso}T00:00:00Z`).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })}`;
}

export function SchedeList({ schede }: { schede: SchedaConMeta[] }) {
  const router = useRouter();
  const { creaScheda, duplicaScheda, eliminaScheda, archiviaScheda, pending, error } = useSchedeMutations();

  const [mostraArchiviate, setMostraArchiviate] = useState(false);
  const [nuovaAperta, setNuovaAperta] = useState(false);
  const [nomeNuova, setNomeNuova] = useState("");
  const [descrizioneNuova, setDescrizioneNuova] = useState("");
  const [eliminando, setEliminando] = useState<SchedaConMeta | null>(null);

  const visibili = useMemo(
    () => schede.filter((s) => mostraArchiviate || !s.is_archiviata),
    [schede, mostraArchiviate]
  );
  const numArchiviate = useMemo(() => schede.filter((s) => s.is_archiviata).length, [schede]);

  async function handleCrea(e: React.FormEvent) {
    e.preventDefault();
    const res = await creaScheda({ nome: nomeNuova, descrizione: descrizioneNuova || null });
    if ("id" in res) router.push(`/allenamenti/scheda/${res.id}`);
  }

  async function handleDuplica(id: string) {
    await duplicaScheda(id);
    router.refresh();
  }

  async function handleElimina() {
    if (!eliminando) return;
    await eliminaScheda(eliminando.id);
    setEliminando(null);
    router.refresh();
  }

  async function handleArchivia(scheda: SchedaConMeta) {
    await archiviaScheda(scheda.id, !scheda.is_archiviata);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Le mie schede</h1>
          <p className="text-sm text-muted">
            {visibili.length} {visibili.length === 1 ? "scheda" : "schede"}
            {mostraArchiviate ? "" : numArchiviate > 0 ? ` · ${numArchiviate} archiviate nascoste` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNuovaAperta(true)}
          className="btn-primary flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Nuova scheda
        </button>
      </div>

      {numArchiviate > 0 && (
        <label className="flex w-fit items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={mostraArchiviate}
            onChange={(e) => setMostraArchiviate(e.target.checked)}
            className="h-3.5 w-3.5 accent-accent"
          />
          Mostra anche le schede archiviate
        </label>
      )}

      {error && (
        <p className="text-sm text-spesa" role="alert">
          {error}
        </p>
      )}

      {visibili.length === 0 ? (
        <div className="card flex items-center justify-center p-6">
          <p className="text-sm text-muted">Nessuna scheda ancora. Creane una per iniziare.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibili.map((scheda) => (
            <div key={scheda.id} className="card card-hover flex flex-col gap-3 p-4">
              <div className="flex flex-col gap-0.5">
                <span className="font-display text-base font-semibold">{scheda.nome}</span>
                {scheda.descrizione && <p className="text-sm text-muted">{scheda.descrizione}</p>}
              </div>

              <div className="flex flex-col gap-0.5 text-xs text-muted">
                <span>
                  {scheda.numBlocchi} {scheda.numBlocchi === 1 ? "blocco" : "blocchi"} ·{" "}
                  {scheda.numEsercizi} {scheda.numEsercizi === 1 ? "esercizio" : "esercizi"}
                </span>
                <span>{formatUltimoUtilizzo(scheda.ultimoUtilizzo)}</span>
              </div>

              <div className="mt-auto flex items-center gap-1.5 border-t border-border pt-3">
                <Link
                  href={`/allenamenti/scheda/${scheda.id}`}
                  className="btn-secondary flex items-center gap-1.5 !px-2 !py-1 text-xs"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Modifica
                </Link>
                <button
                  type="button"
                  onClick={() => handleDuplica(scheda.id)}
                  disabled={pending}
                  aria-label="Duplica scheda"
                  className="btn-icon"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleArchivia(scheda)}
                  disabled={pending}
                  aria-label={scheda.is_archiviata ? "Riattiva scheda" : "Archivia scheda"}
                  className="btn-icon"
                >
                  {scheda.is_archiviata ? (
                    <ArchiveRestore className="h-3.5 w-3.5" />
                  ) : (
                    <Archive className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEliminando(scheda)}
                  aria-label="Elimina scheda"
                  className="btn-icon ml-auto hover:!text-spesa"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {nuovaAperta && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setNuovaAperta(false)}>
          <form onSubmit={handleCrea} className="modal-panel flex w-full max-w-sm flex-col gap-4 p-5">
            <h2 className="font-display text-base font-semibold">Nuova scheda</h2>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted">Nome</span>
              <input
                autoFocus
                value={nomeNuova}
                onChange={(e) => setNomeNuova(e.target.value)}
                className="field-input"
                required
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted">Descrizione (opzionale)</span>
              <textarea
                value={descrizioneNuova}
                onChange={(e) => setDescrizioneNuova(e.target.value)}
                rows={2}
                className="field-input"
              />
            </label>
            {error && (
              <p className="text-sm text-spesa" role="alert">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setNuovaAperta(false)} className="btn-secondary">
                Annulla
              </button>
              <button type="submit" disabled={pending} className="btn-primary">
                {pending ? "Creazione..." : "Crea e apri editor"}
              </button>
            </div>
          </form>
        </div>
      )}

      {eliminando && (
        <DeleteConfirmDialog
          titolo={eliminando.nome}
          title="Eliminare questa scheda?"
          description={
            <>
              &ldquo;{eliminando.nome}&rdquo; e tutti i suoi blocchi/esercizi verranno eliminati. Le sessioni già
              registrate con questa scheda restano nello storico. L&apos;operazione non è reversibile.
            </>
          }
          pending={pending}
          onConfirm={handleElimina}
          onCancel={() => setEliminando(null)}
        />
      )}
    </div>
  );
}
