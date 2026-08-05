"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useImpegniMutations } from "@/hooks/useImpegniMutations";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import type { ImpegnoFisso } from "@/lib/allenamento/types";

const GIORNI = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

export function WeeklyPlanGrid({ impegni }: { impegni: ImpegnoFisso[] }) {
  const router = useRouter();
  const { creaImpegno, eliminaImpegno, pending, error } = useImpegniMutations();
  const [formAperto, setFormAperto] = useState(false);
  const [eliminando, setEliminando] = useState<ImpegnoFisso | null>(null);

  const impegniPerGiorno = GIORNI.map((_, giorno) =>
    impegni.filter((i) => i.giorno_settimana === giorno && i.attivo)
  );

  async function handleCrea(patch: Parameters<typeof creaImpegno>[0]) {
    await creaImpegno(patch);
    setFormAperto(false);
    router.refresh();
  }

  async function handleElimina() {
    if (!eliminando) return;
    await eliminaImpegno(eliminando.id);
    setEliminando(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-medium text-muted">Piano settimanale</h2>
        <button type="button" onClick={() => setFormAperto(true)} className="btn-secondary flex items-center gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Aggiungi impegno
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {GIORNI.map((giorno, index) => (
          <div key={giorno} className="card flex flex-col gap-2 p-3">
            <span className="font-display text-xs font-semibold uppercase tracking-wide text-muted">{giorno}</span>
            {impegniPerGiorno[index].length === 0 ? (
              <span className="text-xs text-muted/60">Nessun impegno</span>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {impegniPerGiorno[index].map((impegno) => (
                  <li
                    key={impegno.id}
                    className="flex items-start justify-between gap-2 rounded-lg border border-border px-2 py-1.5 text-sm"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">{impegno.titolo}</span>
                      {impegno.orario && <span className="font-figures text-xs text-muted">{impegno.orario}</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEliminando(impegno)}
                      aria-label="Rimuovi impegno"
                      className="btn-icon shrink-0 hover:!text-spesa"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {formAperto && (
        <ImpegnoFormModal pending={pending} error={error} onSave={handleCrea} onCancel={() => setFormAperto(false)} />
      )}

      {eliminando && (
        <DeleteConfirmDialog
          titolo={eliminando.titolo}
          title="Rimuovere questo impegno?"
          description={
            <>
              &ldquo;{eliminando.titolo}&rdquo; verrà rimosso dal piano settimanale. L&apos;operazione non è
              reversibile.
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

function ImpegnoFormModal({
  pending,
  error,
  onSave,
  onCancel,
}: {
  pending: boolean;
  error: string | null;
  onSave: (patch: { giorno_settimana: number; titolo: string; orario: string | null; note: string | null }) => void;
  onCancel: () => void;
}) {
  const [giorno, setGiorno] = useState(0);
  const [titolo, setTitolo] = useState("");
  const [orario, setOrario] = useState("");
  const [note, setNote] = useState("");
  const [erroreForm, setErroreForm] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titolo.trim()) {
      setErroreForm("Il titolo è obbligatorio.");
      return;
    }
    setErroreForm(null);
    onSave({ giorno_settimana: giorno, titolo: titolo.trim(), orario: orario || null, note: note || null });
  }

  return (
    <div className="modal-overlay">
      <form onSubmit={handleSubmit} className="modal-panel flex w-full max-w-sm flex-col gap-4 p-5">
        <h2 className="font-display text-base font-semibold">Nuovo impegno fisso</h2>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted">Giorno</span>
          <select value={giorno} onChange={(e) => setGiorno(Number(e.target.value))} className="field-input">
            {GIORNI.map((g, i) => (
              <option key={g} value={i}>
                {g}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted">Titolo</span>
          <input
            value={titolo}
            onChange={(e) => setTitolo(e.target.value)}
            placeholder="es. Boxe, Nuoto"
            required
            className="field-input"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted">Orario (opzionale)</span>
          <input
            value={orario}
            onChange={(e) => setOrario(e.target.value)}
            placeholder="es. 19:00"
            className="field-input"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted">Note (opzionale)</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="field-input" />
        </label>

        {(erroreForm || error) && (
          <p className="text-sm text-spesa" role="alert">
            {erroreForm ?? error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Annulla
          </button>
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? "Salvataggio..." : "Salva"}
          </button>
        </div>
      </form>
    </div>
  );
}
