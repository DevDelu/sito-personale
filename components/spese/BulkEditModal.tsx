"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/spese-utils";
import { CategoriaSelector } from "./CategoriaSelector";
import type { BulkMovimentoPatch } from "@/hooks/useBulkMovimentoMutations";
import type { Categoria, Movimento, TipoCategoria } from "@/lib/types";

type CampoBulk = "categoria" | "tipo" | "descrizione" | "data" | "importo";

export function BulkEditModal({
  righeSelezionate,
  categorie,
  pending,
  error,
  onApply,
  onCancel,
  onCategoriaCreata,
}: {
  righeSelezionate: Movimento[];
  categorie: Categoria[];
  pending: boolean;
  error: string | null;
  onApply: (patch: BulkMovimentoPatch) => void;
  onCancel: () => void;
  onCategoriaCreata?: (categoria: Categoria) => void;
}) {
  const [fase, setFase] = useState<"campi" | "conferma">("campi");
  const [campiAttivi, setCampiAttivi] = useState<Record<CampoBulk, boolean>>({
    categoria: false,
    tipo: false,
    descrizione: false,
    data: false,
    importo: false,
  });

  const [categoriaId, setCategoriaId] = useState("");
  const [tipo, setTipo] = useState<TipoCategoria>("spesa");
  const [descrizione, setDescrizione] = useState("");
  const [data, setData] = useState("");
  const [importo, setImporto] = useState("");
  const [erroreCampi, setErroreCampi] = useState<string | null>(null);

  const count = righeSelezionate.length;

  const tipoUnico = useMemo(() => {
    const primo = righeSelezionate[0]?.tipo;
    return righeSelezionate.every((r) => r.tipo === primo) ? primo : null;
  }, [righeSelezionate]);

  // Senza un tipo comune (selezione mista) non c'è un set di categorie
  // univoco da offrire, a meno che l'utente non stia anche cambiando il
  // tipo in blocco: in quel caso il nuovo tipo scelto fa da filtro.
  const categoriaTipoFiltro = campiAttivi.tipo ? tipo : tipoUnico;
  const categoriaDisponibile = categoriaTipoFiltro !== null;

  // Se la selezione torna "mista" (es. l'utente disattiva il checkbox Tipo
  // dopo averlo attivato), il campo Categoria va disattivato davvero e non
  // solo nascosto: altrimenti il patch finale la applicherebbe comunque.
  if (!categoriaDisponibile && campiAttivi.categoria) {
    setCampiAttivi((prev) => ({ ...prev, categoria: false }));
  }

  function toggleCampo(campo: CampoBulk) {
    setCampiAttivi((prev) => ({ ...prev, [campo]: !prev[campo] }));
    setErroreCampi(null);
  }

  function handleContinua(e: React.FormEvent) {
    e.preventDefault();
    if (!Object.values(campiAttivi).some(Boolean)) {
      setErroreCampi("Seleziona almeno un campo da modificare.");
      return;
    }
    if (campiAttivi.categoria && !categoriaId) {
      setErroreCampi("Seleziona una categoria.");
      return;
    }
    if (campiAttivi.data && !data) {
      setErroreCampi("Seleziona una data.");
      return;
    }
    if (campiAttivi.importo) {
      const importoNum = Number(importo.replace(",", "."));
      if (!Number.isFinite(importoNum) || importoNum <= 0) {
        setErroreCampi("Inserisci un importo valido.");
        return;
      }
    }
    setErroreCampi(null);
    setFase("conferma");
  }

  function buildPatch(): BulkMovimentoPatch {
    const patch: BulkMovimentoPatch = {};
    if (campiAttivi.categoria) patch.categoria_id = categoriaId;
    if (campiAttivi.tipo) patch.tipo = tipo;
    if (campiAttivi.descrizione) patch.descrizione = descrizione || null;
    if (campiAttivi.data) patch.data = data;
    if (campiAttivi.importo) patch.importo = Number(importo.replace(",", "."));
    return patch;
  }

  const categoriaNome = categorie.find((c) => c.id === categoriaId)?.nome ?? categoriaId;
  const righeSummary: { label: string; valore: string }[] = [];
  if (campiAttivi.categoria) righeSummary.push({ label: "Categoria", valore: categoriaNome });
  if (campiAttivi.tipo) righeSummary.push({ label: "Tipo", valore: tipo === "entrata" ? "Entrata" : "Spesa" });
  if (campiAttivi.descrizione) {
    righeSummary.push({ label: "Descrizione", valore: descrizione || "(vuota)" });
  }
  if (campiAttivi.data) {
    righeSummary.push({
      label: "Data",
      valore: new Date(`${data}T00:00:00Z`).toLocaleDateString("it-IT"),
    });
  }
  if (campiAttivi.importo) {
    righeSummary.push({ label: "Importo", valore: formatCurrency(Number(importo.replace(",", "."))) });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-5">
        {fase === "campi" ? (
          <form onSubmit={handleContinua} className="flex flex-col gap-4">
            <div>
              <h2 className="font-display text-base font-semibold">Modifica in blocco</h2>
              <p className="mt-1 text-sm text-muted">
                {count} {count === 1 ? "movimento selezionato" : "movimenti selezionati"}. Attiva i
                campi da sovrascrivere con lo stesso valore su tutte le righe.
              </p>
            </div>

            <CampoRiga
              attivo={campiAttivi.categoria}
              onToggle={() => toggleCampo("categoria")}
              label="Categoria"
              disabled={!categoriaDisponibile}
              hint={!categoriaDisponibile ? "Selezione con tipi misti: attiva anche Tipo per poter cambiare categoria." : undefined}
            >
              <CategoriaSelector
                categorie={categorie}
                tipo={categoriaTipoFiltro ?? "spesa"}
                value={categoriaId}
                onChange={setCategoriaId}
                onCategoriaCreata={onCategoriaCreata}
              />
            </CampoRiga>

            <CampoRiga attivo={campiAttivi.tipo} onToggle={() => toggleCampo("tipo")} label="Tipo">
              <div className="flex gap-2">
                {(["spesa", "entrata"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className={`flex-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      tipo === t
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border text-muted hover:text-foreground"
                    }`}
                  >
                    {t === "spesa" ? "Spesa" : "Entrata"}
                  </button>
                ))}
              </div>
            </CampoRiga>

            <CampoRiga
              attivo={campiAttivi.descrizione}
              onToggle={() => toggleCampo("descrizione")}
              label="Descrizione"
            >
              <input
                value={descrizione}
                onChange={(e) => setDescrizione(e.target.value)}
                placeholder="Nuova descrizione"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
              />
            </CampoRiga>

            <CampoRiga attivo={campiAttivi.data} onToggle={() => toggleCampo("data")} label="Data">
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
              />
            </CampoRiga>

            <CampoRiga attivo={campiAttivi.importo} onToggle={() => toggleCampo("importo")} label="Importo (€)">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={importo}
                onChange={(e) => setImporto(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
              />
            </CampoRiga>

            {erroreCampi && (
              <p className="text-sm text-spesa" role="alert">
                {erroreCampi}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
              >
                Continua
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-base font-semibold">Confermi la modifica in blocco?</h2>
            <p className="text-sm text-muted">
              Stai per modificare <strong className="text-foreground">{count}</strong>{" "}
              {count === 1 ? "movimento" : "movimenti"}:
            </p>
            <ul className="flex flex-col gap-1 rounded-xl border border-border bg-background p-3 text-sm">
              {righeSummary.map((r) => (
                <li key={r.label} className="flex items-center justify-between gap-3">
                  <span className="text-muted">{r.label}</span>
                  <span className="font-medium text-foreground">→ {r.valore}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted">
              L&apos;operazione sovrascrive questi campi su tutte le righe selezionate e non è
              reversibile.
            </p>

            {error && (
              <p className="text-sm text-spesa" role="alert">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setFase("campi")}
                className="rounded-full border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
              >
                Indietro
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => onApply(buildPatch())}
                className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {pending ? "Applicazione..." : "Conferma"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CampoRiga({
  attivo,
  onToggle,
  label,
  children,
  disabled,
  hint,
}: {
  attivo: boolean;
  onToggle: () => void;
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={attivo && !disabled}
          disabled={disabled}
          onChange={onToggle}
          className="h-4 w-4 rounded border-border accent-[var(--accent)]"
        />
        {label}
      </label>
      {hint && <p className="text-xs text-muted">{hint}</p>}
      {attivo && !disabled && children}
    </div>
  );
}
