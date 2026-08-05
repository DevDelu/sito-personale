"use client";

import { useEffect, useState } from "react";
import { useCountdown } from "@/hooks/useCountdown";
import type { SchedaEsercizioConNome, SessioneLog } from "@/lib/allenamento/types";

type SetLog = { rip_effettive?: number | null; peso_effettivo?: number | null; tempo_effettivo_sec?: number | null };

function formatTempo(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
}

function formatUltimoValore(row: SchedaEsercizioConNome, log: SessioneLog): string {
  if (row.tipo_metrica === "tempo") return log.tempo_effettivo_sec != null ? formatTempo(log.tempo_effettivo_sec) : "—";
  const rip = log.rip_effettive != null ? `${log.rip_effettive} rip` : "—";
  const peso = log.peso_effettivo != null ? ` @ ${log.peso_effettivo}kg` : "";
  return `${rip}${peso}`;
}

// Riga "normale": contatore serie con input rip/peso (precompilati col
// target) per gli esercizi a ripetizioni, countdown automatico per quelli a
// tempo (es. Plank, Dead hang) — stesso componente per entrambe le metriche,
// necessario perché un blocco superset può combinarne una di ciascun tipo
// (Blocco 2: Push up a ripetizioni, Dead hang a tempo).
export function SessionRowNormale({
  row,
  numeroSerie,
  ultimoValore,
  tick,
  finish,
  onSetComplete,
  onRestDone,
  pausaGlobale,
}: {
  row: SchedaEsercizioConNome;
  numeroSerie: number;
  ultimoValore: SessioneLog | null;
  tick: () => void;
  finish: () => void;
  onSetComplete: (log: SetLog) => void;
  onRestDone: () => void;
  pausaGlobale: boolean;
}) {
  const [fase, setFase] = useState<"esecuzione" | "riposo">("esecuzione");
  const [rip, setRip] = useState(String(row.target_rip_max ?? row.target_rip_min ?? ""));
  const [peso, setPeso] = useState(row.target_peso != null ? String(row.target_peso) : "");

  const riposoSec = row.riposo_sec ?? 0;
  const {
    remaining: riposoRimanente,
    setInPausa: setRiposoInPausa,
  } = useCountdown(riposoSec, `${row.id}-${numeroSerie}-riposo`, fase === "riposo", {
    tick,
    finish,
    onDone: onRestDone,
  });

  const targetTempo = row.target_tempo_sec ?? 0;
  const {
    remaining: tempoRimanente,
    setInPausa: setEsecuzioneInPausa,
  } = useCountdown(
    targetTempo,
    `${row.id}-${numeroSerie}-esecuzione`,
    row.tipo_metrica === "tempo" && fase === "esecuzione",
    {
      tick,
      finish,
      onDone: () => {
        onSetComplete({ tempo_effettivo_sec: targetTempo });
        if (riposoSec > 0) setFase("riposo");
        else onRestDone();
      },
    }
  );

  useEffect(() => {
    setRiposoInPausa(pausaGlobale);
    setEsecuzioneInPausa(pausaGlobale);
  }, [pausaGlobale, setRiposoInPausa, setEsecuzioneInPausa]);

  function completaSerieManuale() {
    onSetComplete({
      rip_effettive: rip.trim() ? Number(rip) : null,
      peso_effettivo: peso.trim() ? Number(peso) : null,
    });
    if (riposoSec > 0) setFase("riposo");
    else onRestDone();
  }

  const targetLabel =
    row.target_rip_min != null && row.target_rip_max != null
      ? row.target_rip_min === row.target_rip_max
        ? `${row.target_rip_min} rip`
        : `${row.target_rip_min}-${row.target_rip_max} rip`
      : row.target_serie != null
        ? "max"
        : null;

  return (
    <div className="card flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="font-display text-lg font-semibold">{row.esercizio_nome}</span>
          <p className="text-sm text-muted">
            Serie {numeroSerie}
            {row.target_serie != null ? ` di ${row.target_serie}` : ""}
            {targetLabel ? ` · target ${targetLabel}` : ""}
            {row.note ? ` · ${row.note}` : ""}
          </p>
        </div>
        {ultimoValore && (
          <div className="text-right text-xs text-muted">
            <span className="block uppercase tracking-wide">Ultima volta</span>
            <span className="font-figures">{formatUltimoValore(row, ultimoValore)}</span>
          </div>
        )}
      </div>

      {fase === "esecuzione" ? (
        row.tipo_metrica === "tempo" ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <span className="font-figures text-5xl font-bold tabular-nums">{tempoRimanente}s</span>
            <span className="text-xs text-muted">tieni la posizione</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">Ripetizioni</span>
              <input
                type="number"
                value={rip}
                onChange={(e) => setRip(e.target.value)}
                className="field-input w-24"
              />
            </label>
            {row.tipo_metrica === "serie_rip_peso" && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted">Peso (kg)</span>
                <input
                  type="number"
                  step="0.5"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  className="field-input w-24"
                />
              </label>
            )}
            <button type="button" onClick={completaSerieManuale} className="btn-primary">
              Completa serie
            </button>
          </div>
        )
      ) : (
        <div className="flex flex-col items-center gap-2 py-4">
          <span className="text-xs uppercase tracking-wide text-muted">Recupero</span>
          <span className="font-figures text-4xl font-bold tabular-nums">{riposoRimanente}s</span>
          <button type="button" onClick={onRestDone} className="btn-secondary mt-2">
            Salta riposo
          </button>
        </div>
      )}
    </div>
  );
}
