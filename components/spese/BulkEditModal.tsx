"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/spese-utils";
import { CategoriaSelector } from "./CategoriaSelector";
import type { BulkMovimentoPatch } from "@/hooks/useBulkMovimentoMutations";
import type { Categoria, Movimento, TipoCategoria } from "@/lib/types";

type CampoBulk = "categoria" | "tipo" | "titolo" | "descrizione" | "data" | "importo";

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
    titolo: false,
    descrizione: false,
    data: false,
    importo: false,
  });

  const [categoriaId, setCategoriaId] = useState("");
  const [tipo, setTipo] = useState<TipoCategoria>("spesa");
  const [titolo, setTitolo] = useState("");
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
    if (campiAttivi.titolo && !titolo.trim()) {
      setErroreCampi("Inserisci un titolo.");
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
    if (campiAttivi.titolo) patch.titolo = titolo.trim();
    if (campiAttivi.descrizione) patch.descrizione = descrizione || null;
    if (campiAttivi.data) patch.data = data;
    if (campiAttivi.importo) patch.importo = Number(importo.replace(",", "."));
    return patch;
  }

  const categoriaNome = categorie.find((c) => c.id === categoriaId)?.nome ?? categoriaId;
  const righeSummary: { label: string; valore: string }[] = [];
  if (campiAttivi.categoria) righeSummary.push({ label: "Categoria", valore: categoriaNome });
  if (campiAttivi.tipo) righeSummary.push({ label: "Tipo", valore: tipo === "entrata" ? "Entrata" : "Spesa" });
  if (campiAttivi.titolo) righeSummary.push({ label: "Titolo", valore: titolo.trim() });
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
    <div className="modal-overlay">
      <div className="modal-panel w-full max-w-md p-5">
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
                    className={`flex-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200 ease-out active:scale-95 ${
                      tipo === t
                        ? "border-accent bg-accent text-accent-foreground shadow-sm"
                        : "border-border text-muted hover:-translate-y-0.5 hover:text-foreground"
                    }`}
                  >
                    {t === "spesa" ? "Spesa" : "Entrata"}
                  </button>
                ))}
              </div>
            </CampoRiga>

            <CampoRiga attivo={campiAttivi.titolo} onToggle={() => toggleCampo("titolo")} label="Titolo">
              <input
                value={titolo}
                onChange={(e) => setTitolo(e.target.value)}
                placeholder="Nuovo titolo"
                className="field-input w-full"
              />
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
                className="field-input w-full"
              />
            </CampoRiga>

            <CampoRiga attivo={campiAttivi.data} onToggle={() => toggleCampo("data")} label="Data">
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="field-input w-full"
              />
            </CampoRiga>

            <CampoRiga attivo={campiAttivi.importo} onToggle={() => toggleCampo("importo")} label="Importo (€)">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={importo}
                onChange={(e) => setImporto(e.target.value)}
                className="field-input w-full"
              />
            </CampoRiga>

            {erroreCampi && (
              <p className="text-sm text-spesa" role="alert">
                {erroreCampi}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={onCancel} className="btn-secondary">
                Annulla
              </button>
              <button type="submit" className="btn-primary">
                Continua
              </button>
            </div>
          </form>
        ) : (
          <div className="flex animate-fade-in flex-col gap-4">
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
              <button type="button" onClick={() => setFase("campi")} className="btn-secondary">
                Indietro
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => onApply(buildPatch())}
                className="btn-primary"
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
    <div
      className={`flex flex-col gap-2 rounded-xl border p-3 transition-colors duration-200 ${
        attivo && !disabled ? "border-accent/40 bg-accent/5" : "border-border"
      }`}
    >
      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={attivo && !disabled}
          disabled={disabled}
          onChange={onToggle}
          className="h-4 w-4 rounded border-border accent-[var(--accent)] transition-transform active:scale-90"
        />
        {label}
      </label>
      {hint && <p className="text-xs text-muted">{hint}</p>}
      {attivo && !disabled && <div className="animate-slide-down">{children}</div>}
    </div>
  );
}
