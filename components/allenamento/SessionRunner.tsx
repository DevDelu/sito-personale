"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, SkipForward, Square, Wrench } from "lucide-react";
import { useCountdown } from "@/hooks/useCountdown";
import { useSessionAudio } from "@/hooks/useSessionAudio";
import { useWakeLock } from "@/hooks/useWakeLock";
import { salvaLogSerie, terminaSessione, type LogSeriePatch } from "@/app/(private)/allenamenti/actions";
import { setSessionNavGuard } from "@/lib/allenamento/session-guard";
import { SessionRowNormale } from "./SessionRowNormale";
import { SessionRowCircuito } from "./SessionRowCircuito";
import { SessionRowStretching } from "./SessionRowStretching";
import type { Scheda, SchedaEsercizioConNome, Sessione, SessioneLog } from "@/lib/allenamento/types";

type Step =
  | { kind: "normale-solo"; row: SchedaEsercizioConNome }
  | { kind: "superset"; rowA: SchedaEsercizioConNome; rowB: SchedaEsercizioConNome }
  | { kind: "circuito"; row: SchedaEsercizioConNome }
  | { kind: "stretching"; row: SchedaEsercizioConNome };

// Un blocco con esattamente 2 righe "normale" è un superset (es. "Blocco 1 -
// Trazioni/Dip"): si alterna tra le due a ogni serie. Blocchi con un numero
// diverso di righe (Riscaldamento, Addome) restano righe sequenziali
// indipendenti, non supersettate.
function buildSteps(righe: SchedaEsercizioConNome[]): Step[] {
  const perBlocco = new Map<string, SchedaEsercizioConNome[]>();
  const ordineBlocchi: string[] = [];
  for (const r of righe) {
    if (!perBlocco.has(r.blocco)) ordineBlocchi.push(r.blocco);
    const list = perBlocco.get(r.blocco) ?? [];
    list.push(r);
    perBlocco.set(r.blocco, list);
  }

  const steps: Step[] = [];
  for (const blocco of ordineBlocchi) {
    const gruppo = (perBlocco.get(blocco) ?? []).slice().sort((a, b) => a.ordine - b.ordine);
    if (gruppo.length === 2 && gruppo.every((r) => r.tipo_riga === "normale")) {
      steps.push({ kind: "superset", rowA: gruppo[0], rowB: gruppo[1] });
      continue;
    }
    for (const row of gruppo) {
      if (row.tipo_riga === "circuito") steps.push({ kind: "circuito", row });
      else if (row.tipo_riga === "stretching") steps.push({ kind: "stretching", row });
      else steps.push({ kind: "normale-solo", row });
    }
  }
  return steps;
}

function contaCompletate(logEsistenti: SessioneLog[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const log of logEsistenti) {
    map[log.scheda_esercizio_id] = (map[log.scheda_esercizio_id] ?? 0) + 1;
  }
  return map;
}

function rowCompletata(row: SchedaEsercizioConNome, completate: Record<string, number>): boolean {
  return (completate[row.id] ?? 0) >= (row.target_serie ?? 1);
}

function stepCompletato(step: Step, completate: Record<string, number>): boolean {
  if (step.kind === "superset") return rowCompletata(step.rowA, completate) && rowCompletata(step.rowB, completate);
  return rowCompletata(step.row, completate);
}

// null = entrambe le righe del superset completate (lo step è finito).
function turnoSuperset(
  rowA: SchedaEsercizioConNome,
  rowB: SchedaEsercizioConNome,
  completate: Record<string, number>
): SchedaEsercizioConNome | null {
  const doneA = rowCompletata(rowA, completate);
  const doneB = rowCompletata(rowB, completate);
  if (doneA && doneB) return null;
  if (doneA) return rowB;
  if (doneB) return rowA;
  const totale = (completate[rowA.id] ?? 0) + (completate[rowB.id] ?? 0);
  return totale % 2 === 0 ? rowA : rowB;
}

function righeStep(step: Step): SchedaEsercizioConNome[] {
  return step.kind === "superset" ? [step.rowA, step.rowB] : [step.row];
}

function nomeStep(step: Step): string {
  return righeStep(step)
    .map((r) => r.esercizio_nome)
    .join(" + ");
}

function attrezzaturaStep(step: Step): string[] {
  const viste = new Set<string>();
  for (const r of righeStep(step)) {
    if (r.attrezzatura) viste.add(r.attrezzatura);
  }
  return [...viste];
}

function formatTempoBreve(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
}

// Cosa c'è da fare per una singola riga, in breve: "3 serie da 10-12 rip",
// "4 round · 40s lavoro / 15s pausa", "30s". Usato sia nella card "Prossimo"
// durante la sessione, sia nell'annuncio pre-allenamento.
function descrizioneRiga(row: SchedaEsercizioConNome): string {
  if (row.tipo_riga === "circuito") {
    const rounds = row.rounds ?? 1;
    const lavoro = row.lavoro_sec ?? 30;
    const pausa = row.pausa_sec ?? 0;
    return pausa > 0 ? `${rounds} round · ${lavoro}s lavoro / ${pausa}s pausa` : `${rounds} round · ${lavoro}s lavoro`;
  }
  if (row.tipo_riga === "stretching") {
    return `${row.target_tempo_sec ?? 30}s`;
  }
  if (row.tipo_metrica === "tempo") {
    return `${row.target_serie ?? 1} serie da ${formatTempoBreve(row.target_tempo_sec ?? 0)}`;
  }
  const rip =
    row.target_rip_min != null && row.target_rip_max != null
      ? row.target_rip_min === row.target_rip_max
        ? `${row.target_rip_min} rip`
        : `${row.target_rip_min}-${row.target_rip_max} rip`
      : "max rip";
  return `${row.target_serie ?? 1} serie da ${rip}`;
}

function descrizioneStep(step: Step): string {
  return righeStep(step)
    .map(descrizioneRiga)
    .join(" + ");
}

export function SessionRunner({
  sessione,
  scheda,
  righe,
  logEsistenti,
  ultimiValori,
}: {
  sessione: Sessione;
  scheda: Scheda;
  righe: SchedaEsercizioConNome[];
  logEsistenti: SessioneLog[];
  ultimiValori: Record<string, SessioneLog | null>;
}) {
  const router = useRouter();
  const audio = useSessionAudio();

  const steps = useMemo(() => buildSteps(righe), [righe]);
  const [completate, setCompletate] = useState<Record<string, number>>(() => contaCompletate(logEsistenti));
  const [stepIndex, setStepIndex] = useState(() => {
    const idx = steps.findIndex((s) => !stepCompletato(s, completate));
    return idx === -1 ? steps.length : idx;
  });
  const [avviato, setAvviato] = useState(false);
  const [inPreparazione, setInPreparazione] = useState(false);
  const [pausaGlobale, setPausaGlobale] = useState(false);
  const [mostraFine, setMostraFine] = useState(false);
  const [confermaTermina, setConfermaTermina] = useState(false);
  const [navigazionePendente, setNavigazionePendente] = useState<string | null>(null);
  const [terminandoENavigando, setTerminandoENavigando] = useState(false);
  const startedAtRef = useRef<number | null>(null);

  const sessioneInCorso = avviato || inPreparazione;
  useWakeLock(sessioneInCorso);

  // Mentre l'allenamento è in corso (compresa la preparazione pre-avvio), la
  // sidebar intercetta i click sui link di navigazione e li passa qui invece
  // di navigare subito (vedi lib/allenamento/session-guard.ts): si sgancia da
  // sola quando la sessione finisce o il componente viene smontato.
  useEffect(() => {
    if (!sessioneInCorso || mostraFine) return;
    setSessionNavGuard((href) => setNavigazionePendente(href));
    return () => setSessionNavGuard(null);
  }, [sessioneInCorso, mostraFine]);

  async function terminaENaviga() {
    setTerminandoENavigando(true);
    const startedAt = startedAtRef.current;
    const durataMin = startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 60000)) : null;
    await terminaSessione(sessione.id, { durata_min: durataMin, sensazione: null, note: null });
    setTerminandoENavigando(false);
    const href = navigazionePendente;
    setNavigazionePendente(null);
    if (href) router.push(href);
  }

  const stepCorrente = stepIndex < steps.length ? steps[stepIndex] : null;
  const prossimoStep = stepIndex + 1 < steps.length ? steps[stepIndex + 1] : null;

  // Unico punto che fa avanzare lo step: reagisce a `completate` cambiando
  // (pattern "adjust state during render", non un useEffect: qui la
  // transizione deve essere immediata, non dopo un giro di commit+effetto).
  // Gestisce anche il cambio di turno nel superset (si ricalcola da solo).
  const [completatePrecedente, setCompletatePrecedente] = useState(completate);
  if (completate !== completatePrecedente) {
    setCompletatePrecedente(completate);
    if (avviato && !mostraFine && stepCorrente && stepCompletato(stepCorrente, completate)) {
      setStepIndex((i) => i + 1);
    }
  }

  function avviaSessione() {
    audio.unlock();
    if (steps.length === 0) {
      startedAtRef.current = Date.now();
      setAvviato(true);
      return;
    }
    setInPreparazione(true);
  }

  function confermaAvvio() {
    startedAtRef.current = Date.now();
    setInPreparazione(false);
    setAvviato(true);
  }

  function avanzaSerie(rowId: string) {
    setCompletate((prev) => ({ ...prev, [rowId]: (prev[rowId] ?? 0) + 1 }));
  }

  async function persistiSerie(schedaEsercizioId: string, log: Omit<LogSeriePatch, "scheda_esercizio_id">) {
    try {
      await salvaLogSerie(sessione.id, { scheda_esercizio_id: schedaEsercizioId, ...log });
    } catch {
      // Salvataggio fallito: la sessione prosegue comunque, si accetta un
      // buco nello storico piuttosto che bloccare l'allenamento in corso.
    }
  }

  if (!avviato) {
    if (inPreparazione && stepCorrente) {
      return (
        <PreparazionePrompt
          step={stepCorrente}
          tick={audio.tick}
          finish={audio.finish}
          onDone={confermaAvvio}
        />
      );
    }
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-2xl font-semibold">{scheda.nome}</h1>
        {scheda.descrizione && <p className="max-w-sm text-sm text-muted">{scheda.descrizione}</p>}
        <button
          type="button"
          onClick={avviaSessione}
          className="btn-primary flex items-center gap-2 !px-6 !py-3 text-base"
        >
          <Play className="h-4 w-4" />
          Inizia allenamento
        </button>
      </div>
    );
  }

  if (mostraFine || !stepCorrente) {
    return (
      <FineSessioneForm
        sessioneId={sessione.id}
        startedAtRef={startedAtRef}
        onDone={() => router.push("/allenamenti/storico")}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 pb-24">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          {stepCorrente.kind === "superset" ? stepCorrente.rowA.blocco : stepCorrente.row.blocco}
        </span>
        <span className="font-figures text-xs text-muted">
          Passo {stepIndex + 1} di {steps.length}
        </span>
      </div>

      <StepView
        step={stepCorrente}
        completate={completate}
        ultimiValori={ultimiValori}
        pausaGlobale={pausaGlobale}
        tick={audio.tick}
        finish={audio.finish}
        onSetComplete={(rowId, log) => persistiSerie(rowId, log)}
        onSetAdvance={avanzaSerie}
      />

      {prossimoStep && (
        <div className="rounded-xl border border-border bg-surface/60 p-3">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Prossimo</span>
          <p className="mt-1 text-sm font-medium">{nomeStep(prossimoStep)}</p>
          <p className="mt-0.5 text-sm text-muted">{descrizioneStep(prossimoStep)}</p>
          {attrezzaturaStep(prossimoStep).length > 0 && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-amber-500 dark:text-amber-400">
              <Wrench className="h-3.5 w-3.5 shrink-0" />
              Prepara: {attrezzaturaStep(prossimoStep).join(", ")}
            </p>
          )}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-center gap-2 border-t border-border bg-surface/95 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md">
        <button
          type="button"
          onClick={() => setStepIndex((i) => i + 1)}
          className="btn-secondary flex items-center gap-1.5"
        >
          <SkipForward className="h-3.5 w-3.5" />
          Salta
        </button>
        <button
          type="button"
          onClick={() => setPausaGlobale((v) => !v)}
          className="btn-secondary flex items-center gap-1.5"
        >
          <Pause className="h-3.5 w-3.5" />
          {pausaGlobale ? "Riprendi" : "Pausa"}
        </button>
        <button type="button" onClick={() => setConfermaTermina(true)} className="btn-danger flex items-center gap-1.5">
          <Square className="h-3.5 w-3.5" />
          Termina
        </button>
      </div>

      {pausaGlobale && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-background/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <span className="font-display text-xl font-semibold">In pausa</span>
            <button type="button" onClick={() => setPausaGlobale(false)} className="btn-primary">
              Riprendi
            </button>
          </div>
        </div>
      )}

      {confermaTermina && (
        <ConfermaDialog
          titolo="Terminare l'allenamento?"
          messaggio="Stai per uscire dallo step corrente e passare al riepilogo finale."
          confermaLabel="Termina"
          annullaLabel="Continua allenamento"
          onConferma={() => {
            setConfermaTermina(false);
            setMostraFine(true);
          }}
          onAnnulla={() => setConfermaTermina(false)}
        />
      )}

      {navigazionePendente && (
        <ConfermaDialog
          titolo="Terminare l'allenamento?"
          messaggio="Stai uscendo da questa sezione mentre l'allenamento è in corso. Vuoi terminarlo?"
          confermaLabel={terminandoENavigando ? "Terminazione..." : "Termina allenamento"}
          annullaLabel="No, resta qui"
          confermaDisabled={terminandoENavigando}
          onConferma={terminaENaviga}
          onAnnulla={() => setNavigazionePendente(null)}
        />
      )}
    </div>
  );
}

function ConfermaDialog({
  titolo,
  messaggio,
  confermaLabel,
  annullaLabel,
  confermaDisabled,
  onConferma,
  onAnnulla,
}: {
  titolo: string;
  messaggio: string;
  confermaLabel: string;
  annullaLabel: string;
  confermaDisabled?: boolean;
  onConferma: () => void;
  onAnnulla: () => void;
}) {
  return (
    <div className="modal-overlay">
      <div className="modal-panel flex w-full max-w-sm flex-col gap-4 p-5 text-center">
        <h2 className="font-display text-base font-semibold">{titolo}</h2>
        <p className="text-sm text-muted">{messaggio}</p>
        <div className="flex justify-center gap-3">
          <button type="button" onClick={onAnnulla} className="btn-secondary">
            {annullaLabel}
          </button>
          <button type="button" onClick={onConferma} disabled={confermaDisabled} className="btn-danger">
            {confermaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Annuncio del primo esercizio con countdown di preparazione di 30s (stessi
// beep degli altri timer della sessione) prima dell'avvio vero. Skippabile
// col bottone "Inizia subito".
function PreparazionePrompt({
  step,
  tick,
  finish,
  onDone,
}: {
  step: Step;
  tick: () => void;
  finish: () => void;
  onDone: () => void;
}) {
  const { remaining } = useCountdown(30, "preparazione", true, { tick, finish, onDone });

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">Si parte con</span>
      <h1 className="font-display text-2xl font-semibold">{nomeStep(step)}</h1>
      <p className="text-sm text-muted">{descrizioneStep(step)}</p>
      {attrezzaturaStep(step).length > 0 && (
        <p className="flex items-center gap-1.5 text-sm text-amber-500 dark:text-amber-400">
          <Wrench className="h-3.5 w-3.5 shrink-0" />
          Prepara: {attrezzaturaStep(step).join(", ")}
        </p>
      )}
      <span className="font-figures text-6xl font-bold tabular-nums text-accent">{remaining}s</span>
      <button type="button" onClick={onDone} className="btn-secondary">
        Inizia subito
      </button>
    </div>
  );
}

function StepView({
  step,
  completate,
  ultimiValori,
  pausaGlobale,
  tick,
  finish,
  onSetComplete,
  onSetAdvance,
}: {
  step: Step;
  completate: Record<string, number>;
  ultimiValori: Record<string, SessioneLog | null>;
  pausaGlobale: boolean;
  tick: () => void;
  finish: () => void;
  onSetComplete: (rowId: string, log: Omit<LogSeriePatch, "scheda_esercizio_id">) => void;
  onSetAdvance: (rowId: string) => void;
}) {
  // Lo step è già completo (es. superset appena chiuso, o riga a target
  // superato di un frame prima che l'effetto del genitore avanzi lo step
  // successivo): nessuna card, l'avanzamento arriva al render successivo.
  if (stepCompletato(step, completate)) return null;

  if (step.kind === "circuito") {
    return (
      <SessionRowCircuito
        key={step.row.id}
        row={step.row}
        tick={tick}
        finish={finish}
        pausaGlobale={pausaGlobale}
        onComplete={() => {
          onSetComplete(step.row.id, { serie_effettive: step.row.rounds ?? null });
          onSetAdvance(step.row.id);
        }}
      />
    );
  }

  if (step.kind === "stretching") {
    return (
      <SessionRowStretching
        key={step.row.id}
        row={step.row}
        tick={tick}
        finish={finish}
        pausaGlobale={pausaGlobale}
        onComplete={() => {
          onSetComplete(step.row.id, { tempo_effettivo_sec: step.row.target_tempo_sec ?? null });
          onSetAdvance(step.row.id);
        }}
      />
    );
  }

  const row = step.kind === "superset" ? turnoSuperset(step.rowA, step.rowB, completate) : step.row;
  if (!row) return null;

  const numeroSerie = (completate[row.id] ?? 0) + 1;

  return (
    <SessionRowNormale
      key={`${row.id}-${numeroSerie}`}
      row={row}
      numeroSerie={numeroSerie}
      ultimoValore={ultimiValori[row.id] ?? null}
      tick={tick}
      finish={finish}
      pausaGlobale={pausaGlobale}
      onSetComplete={(log) => onSetComplete(row.id, log)}
      onRestDone={() => onSetAdvance(row.id)}
    />
  );
}

function FineSessioneForm({
  sessioneId,
  startedAtRef,
  onDone,
}: {
  sessioneId: string;
  startedAtRef: React.RefObject<number | null>;
  onDone: () => void;
}) {
  const [sensazione, setSensazione] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  async function salva() {
    setPending(true);
    setErrore(null);
    // Letto qui (in un handler, non durante il render): react-hooks/refs
    // vieta la lettura di ref.current nel corpo di render del componente.
    const startedAt = startedAtRef.current;
    const durataMin = startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 60000)) : null;
    const res = await terminaSessione(sessioneId, { durata_min: durataMin, sensazione, note: note || null });
    setPending(false);
    if (res?.error) {
      setErrore(res.error);
      return;
    }
    onDone();
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
      <h1 className="font-display text-2xl font-semibold">Allenamento completato</h1>

      <div className="flex flex-col items-center gap-2">
        <span className="text-sm text-muted">Come ti sei sentito?</span>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setSensazione(v)}
              className={`h-10 w-10 rounded-full border text-sm font-medium transition-all duration-200 ${
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

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (opzionale)"
        rows={3}
        className="field-input w-full max-w-sm"
      />

      {errore && (
        <p className="text-sm text-spesa" role="alert">
          {errore}
        </p>
      )}

      <button type="button" onClick={salva} disabled={pending} className="btn-primary !px-6 !py-3">
        {pending ? "Salvataggio..." : "Salva e termina"}
      </button>
    </div>
  );
}
