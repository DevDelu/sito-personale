"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useStoricoMutations } from "@/hooks/useStoricoMutations";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import type { SessioneLogConNome } from "@/lib/allenamento/queries";
import type { Sessione } from "@/lib/allenamento/types";

function formatData(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("it-IT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

type RigaForm = {
  serie: string;
  rip: string;
  peso: string;
  tempo: string;
};

function statoRiga(l: SessioneLogConNome): RigaForm {
  return {
    serie: l.serie_effettive != null ? String(l.serie_effettive) : "",
    rip: l.rip_effettive != null ? String(l.rip_effettive) : "",
    peso: l.peso_effettivo != null ? String(l.peso_effettivo) : "",
    tempo: l.tempo_effettivo_sec != null ? String(l.tempo_effettivo_sec) : "",
  };
}

function numOrNull(v: string): number | null {
  return v.trim() ? Number(v) : null;
}

function raggruppaPerBlocco(log: SessioneLogConNome[]): { blocco: string; righe: SessioneLogConNome[] }[] {
  const mappa = new Map<string, SessioneLogConNome[]>();
  const ordine: string[] = [];
  for (const l of log) {
    if (!mappa.has(l.blocco)) {
      mappa.set(l.blocco, []);
      ordine.push(l.blocco);
    }
    mappa.get(l.blocco)!.push(l);
  }
  return ordine.map((blocco) => ({ blocco, righe: mappa.get(blocco)! }));
}

export function SessionDetailEditor({ sessione, log }: { sessione: Sessione; log: SessioneLogConNome[] }) {
  const router = useRouter();
  const { aggiornaSessione, eliminaSessione, aggiornaLog, eliminaLog, pending, error } = useStoricoMutations();

  const blocchi = useMemo(() => raggruppaPerBlocco(log), [log]);

  const [form, setForm] = useState<Record<string, RigaForm>>(() =>
    Object.fromEntries(log.map((l) => [l.id, statoRiga(l)]))
  );
  const [salvato, setSalvato] = useState<Record<string, SessioneLogConNome>>(() =>
    Object.fromEntries(log.map((l) => [l.id, l]))
  );

  const [durataMin, setDurataMin] = useState(sessione.durata_min != null ? String(sessione.durata_min) : "");
  const [sensazione, setSensazione] = useState<number | null>(sessione.sensazione);
  const [note, setNote] = useState(sessione.note ?? "");

  const [eliminandoLog, setEliminandoLog] = useState<SessioneLogConNome | null>(null);
  const [eliminandoSessione, setEliminandoSessione] = useState(false);

  function isDirty(id: string): boolean {
    const f = form[id];
    const s = statoRiga(salvato[id]);
    return f.serie !== s.serie || f.rip !== s.rip || f.peso !== s.peso || f.tempo !== s.tempo;
  }

  async function salvaRiga(id: string) {
    const f = form[id];
    await aggiornaLog(id, {
      serie_effettive: numOrNull(f.serie),
      rip_effettive: numOrNull(f.rip),
      peso_effettivo: numOrNull(f.peso),
      tempo_effettivo_sec: numOrNull(f.tempo),
    });
    setSalvato((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        serie_effettive: numOrNull(f.serie),
        rip_effettive: numOrNull(f.rip),
        peso_effettivo: numOrNull(f.peso),
        tempo_effettivo_sec: numOrNull(f.tempo),
      },
    }));
    router.refresh();
  }

  async function handleEliminaLog() {
    if (!eliminandoLog) return;
    await eliminaLog(eliminandoLog.id);
    setEliminandoLog(null);
    router.refresh();
  }

  async function salvaSessione() {
    await aggiornaSessione(sessione.id, {
      durata_min: durataMin.trim() ? Number(durataMin) : null,
      sensazione,
      note: note.trim() || null,
    });
    router.refresh();
  }

  async function handleEliminaSessione() {
    await eliminaSessione(sessione.id);
    router.push("/allenamenti/storico");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/allenamenti/storico" className="flex items-center gap-1 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Storico
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight capitalize">{formatData(sessione.data)}</h1>
      </div>

      {error && (
        <p className="text-sm text-spesa" role="alert">
          {error}
        </p>
      )}

      <div className="card flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-medium text-muted">Dati sessione</h2>
          <button
            type="button"
            onClick={() => setEliminandoSessione(true)}
            className="btn-secondary flex items-center gap-1.5 hover:!border-spesa/40 hover:!text-spesa"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Elimina sessione
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-muted">Durata (min)</span>
            <input
              type="number"
              min="0"
              value={durataMin}
              onChange={(e) => setDurataMin(e.target.value)}
              className="field-input"
            />
          </label>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-muted">Sensazione</span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setSensazione(sensazione === v ? null : v)}
                  className={`h-8 w-8 rounded-full border text-sm font-medium transition-all duration-200 ${
                    sensazione === v
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border text-muted hover:text-foreground"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted">Note</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="field-input" />
        </label>

        <div className="flex justify-end">
          <button type="button" onClick={salvaSessione} disabled={pending} className="btn-primary">
            {pending ? "Salvataggio..." : "Salva"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {blocchi.map(({ blocco, righe }) => (
          <div key={blocco} className="card flex flex-col gap-3 p-4">
            <span className="font-display text-sm font-semibold">{blocco}</span>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted">
                    <th className="py-2 pr-3 font-medium">Esercizio</th>
                    <th className="py-2 pr-3 font-medium">Serie</th>
                    <th className="py-2 pr-3 font-medium">Rip.</th>
                    <th className="py-2 pr-3 font-medium">Peso (kg)</th>
                    <th className="py-2 pr-3 font-medium">Tempo (sec)</th>
                    <th className="py-2 pr-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {righe.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="py-2 pr-3 whitespace-nowrap">{r.esercizio_nome}</td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          value={form[r.id].serie}
                          onChange={(e) => setForm((f) => ({ ...f, [r.id]: { ...f[r.id], serie: e.target.value } }))}
                          className="field-input w-16 !py-1"
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          value={form[r.id].rip}
                          onChange={(e) => setForm((f) => ({ ...f, [r.id]: { ...f[r.id], rip: e.target.value } }))}
                          className="field-input w-16 !py-1"
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          step="0.5"
                          value={form[r.id].peso}
                          onChange={(e) => setForm((f) => ({ ...f, [r.id]: { ...f[r.id], peso: e.target.value } }))}
                          className="field-input w-20 !py-1"
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          value={form[r.id].tempo}
                          onChange={(e) => setForm((f) => ({ ...f, [r.id]: { ...f[r.id], tempo: e.target.value } }))}
                          className="field-input w-20 !py-1"
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => salvaRiga(r.id)}
                            disabled={pending || !isDirty(r.id)}
                            aria-label="Salva riga"
                            className="btn-icon disabled:opacity-30"
                          >
                            <Save className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEliminandoLog(r)}
                            aria-label="Elimina riga"
                            className="btn-icon hover:!text-spesa"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {blocchi.length === 0 && (
          <div className="card flex items-center justify-center p-6">
            <p className="text-sm text-muted">Nessuna serie registrata per questa sessione.</p>
          </div>
        )}
      </div>

      {eliminandoLog && (
        <DeleteConfirmDialog
          titolo={eliminandoLog.esercizio_nome}
          title="Eliminare questa riga?"
          description={<>La serie registrata per &ldquo;{eliminandoLog.esercizio_nome}&rdquo; verrà rimossa definitivamente.</>}
          pending={pending}
          onConfirm={handleEliminaLog}
          onCancel={() => setEliminandoLog(null)}
        />
      )}

      {eliminandoSessione && (
        <DeleteConfirmDialog
          titolo={formatData(sessione.data)}
          title="Eliminare l'intera sessione?"
          description="Tutte le serie registrate in questa sessione verranno rimosse definitivamente. L'operazione non è reversibile."
          pending={pending}
          onConfirm={handleEliminaSessione}
          onCancel={() => setEliminandoSessione(false)}
        />
      )}
    </div>
  );
}
