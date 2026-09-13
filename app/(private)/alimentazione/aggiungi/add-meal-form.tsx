"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { aggiungiPasto, type AggiungiPastoState } from "../actions";
import { AlimentoSelector } from "@/components/alimentazione/AlimentoSelector";
import type { Alimento, Pasto, TipoPasto } from "@/lib/alimentazione/types";

const oggi = () => new Date().toISOString().slice(0, 10);

const TIPI: { value: TipoPasto; label: string }[] = [
  { value: "colazione", label: "Colazione" },
  { value: "pranzo", label: "Pranzo" },
  { value: "cena", label: "Cena" },
  { value: "spuntino", label: "Spuntino" },
];

export function AddMealForm({ alimenti, pastiRecenti }: { alimenti: Alimento[]; pastiRecenti: Pasto[] }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<AggiungiPastoState, FormData>(aggiungiPasto, undefined);

  const [alimentiList, setAlimentiList] = useState(alimenti);
  const [tipoPasto, setTipoPasto] = useState<TipoPasto>("colazione");
  const [alimentoId, setAlimentoId] = useState("");
  const [quantita, setQuantita] = useState("100");

  function handleAlimentoCreato(nuovo: Alimento) {
    setAlimentiList((prev) =>
      prev.some((a) => a.id === nuovo.id) ? prev : [...prev, nuovo].sort((a, b) => a.nome.localeCompare(b.nome))
    );
  }

  const alimentoSelezionato = alimentiList.find((a) => a.id === alimentoId) ?? null;
  const quantitaNum = Number(quantita.replace(",", "."));
  const preview = useMemo(() => {
    if (!alimentoSelezionato || !Number.isFinite(quantitaNum) || quantitaNum <= 0) return null;
    const fattore = quantitaNum / 100;
    return {
      kcal: Math.round(alimentoSelezionato.kcal_100g * fattore * 10) / 10,
      proteine: Math.round(alimentoSelezionato.proteine_100g * fattore * 10) / 10,
      carboidrati: Math.round(alimentoSelezionato.carboidrati_100g * fattore * 10) / 10,
      grassi: Math.round(alimentoSelezionato.grassi_100g * fattore * 10) / 10,
    };
  }, [alimentoSelezionato, quantitaNum]);

  // "Duplica ultimo pasto simile": l'ultimo pasto registrato dello stesso
  // tipo, con l'alimento ancora presente in catalogo (alimento_id può essere
  // null se l'alimento originale è stato rimosso — snapshot storico, vedi
  // migration). Precompila alimento e quantità senza uscire dal flusso.
  const ultimoSimile = pastiRecenti.find(
    (p) => p.tipo_pasto === tipoPasto && p.alimento_id && alimentiList.some((a) => a.id === p.alimento_id)
  );

  function duplicaUltimo() {
    if (!ultimoSimile || !ultimoSimile.alimento_id) return;
    setAlimentoId(ultimoSimile.alimento_id);
    setQuantita(String(ultimoSimile.quantita_g));
  }

  return (
    <form action={formAction} className="flex w-full max-w-lg animate-slide-up flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {TIPI.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTipoPasto(t.value)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ease-out active:scale-95 ${
              tipoPasto === t.value
                ? "border-accent bg-accent text-accent-foreground shadow-sm"
                : "border-border text-muted hover:-translate-y-0.5 hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <input type="hidden" name="tipo_pasto" value={tipoPasto} />
      <input type="hidden" name="alimento_id" value={alimentoId} />

      {ultimoSimile && (
        <button
          type="button"
          onClick={duplicaUltimo}
          className="btn-secondary self-start !px-3 !py-1.5 text-xs"
        >
          Duplica ultimo {TIPI.find((t) => t.value === tipoPasto)?.label.toLowerCase()} ({ultimoSimile.alimento_nome},{" "}
          {ultimoSimile.quantita_g}g)
        </button>
      )}

      <Field label="Alimento">
        <AlimentoSelector
          alimenti={alimentiList}
          value={alimentoId}
          onChange={setAlimentoId}
          onAlimentoCreato={handleAlimentoCreato}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Quantità (g)">
          <input
            name="quantita_g"
            type="number"
            min="1"
            step="1"
            required
            value={quantita}
            onChange={(e) => setQuantita(e.target.value)}
            className="field-input bg-surface"
          />
        </Field>
        <Field label="Data">
          <input name="data" type="date" required defaultValue={oggi()} className="field-input bg-surface" />
        </Field>
      </div>

      {preview && (
        <div className="card flex flex-wrap gap-4 p-3 text-sm animate-fade-in">
          <PreviewValue label="Kcal" value={preview.kcal} />
          <PreviewValue label="Proteine" value={`${preview.proteine}g`} />
          <PreviewValue label="Carbo" value={`${preview.carboidrati}g`} />
          <PreviewValue label="Grassi" value={`${preview.grassi}g`} />
        </div>
      )}

      <Field label="Note (opzionale)">
        <textarea name="note" rows={2} className="rounded-xl border border-border bg-surface px-3 py-2 text-foreground outline-none focus:border-accent" />
      </Field>

      {state?.error && (
        <p className="text-sm text-spesa" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={pending || !alimentoId} className="btn-primary">
          {pending ? "Salvataggio..." : "Aggiungi"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Annulla
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

function PreviewValue({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted">{label}</span>
      <span className="font-figures font-semibold">{value}</span>
    </div>
  );
}
