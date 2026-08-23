"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, ChevronDown, ChevronUp, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useSchedaMutations } from "@/hooks/useSchedaMutations";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { SchedaEsercizioModal } from "./SchedaEsercizioModal";
import type { SchedaEsercizioFields, NuovoSchedaEsercizioInput } from "@/app/(private)/allenamenti/actions";
import type { Esercizio, Scheda, SchedaEsercizioConNome } from "@/lib/allenamento/types";

type CampiModale = SchedaEsercizioFields &
  Pick<NuovoSchedaEsercizioInput, "esercizio_id" | "nuovo_esercizio_nome" | "nuovo_esercizio_tipo_metrica">;

type Blocco = { nome: string; esercizi: SchedaEsercizioConNome[] };

function raggruppaPerBlocco(righe: SchedaEsercizioConNome[]): Blocco[] {
  const mappa = new Map<string, SchedaEsercizioConNome[]>();
  const ordine: string[] = [];
  for (const r of righe) {
    if (!mappa.has(r.blocco)) {
      mappa.set(r.blocco, []);
      ordine.push(r.blocco);
    }
    mappa.get(r.blocco)!.push(r);
  }
  return ordine.map((nome) => ({ nome, esercizi: mappa.get(nome)! }));
}

function targetLabel(r: SchedaEsercizioConNome): string {
  const parti: string[] = [];
  if (r.target_serie != null) parti.push(`${r.target_serie} serie`);
  if (r.target_rip_min != null || r.target_rip_max != null) {
    parti.push(
      r.target_rip_min != null && r.target_rip_max != null && r.target_rip_min !== r.target_rip_max
        ? `${r.target_rip_min}-${r.target_rip_max} rip`
        : `${r.target_rip_min ?? r.target_rip_max} rip`
    );
  }
  if (r.target_peso != null) parti.push(`${r.target_peso}kg`);
  if (r.target_tempo_sec != null) parti.push(`${r.target_tempo_sec}s`);
  if (r.riposo_sec != null) parti.push(`riposo ${r.riposo_sec}s`);
  if (r.rounds != null) parti.push(`${r.rounds} round`);
  if (r.lavoro_sec != null) parti.push(`${r.lavoro_sec}s lavoro`);
  if (r.pausa_sec != null) parti.push(`${r.pausa_sec}s pausa`);
  if (r.zona_corporea) parti.push(r.zona_corporea);
  return parti.length > 0 ? parti.join(" · ") : "—";
}

export function SchedaEditor({
  scheda,
  righe,
  catalogo,
}: {
  scheda: Scheda;
  righe: SchedaEsercizioConNome[];
  catalogo: Esercizio[];
}) {
  const router = useRouter();
  const { aggiornaEsercizio, eliminaEsercizio, aggiungiEsercizio, riordina, rinominaBlocco, eliminaBlocco, pending, error } =
    useSchedaMutations();

  const blocchi = useMemo(() => raggruppaPerBlocco(righe), [righe]);
  const nomiBlocchi = useMemo(() => blocchi.map((b) => b.nome), [blocchi]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [modaleAperto, setModaleAperto] = useState<
    { modo: "nuovo"; blocco?: string } | { modo: "modifica"; riga: SchedaEsercizioConNome } | null
  >(null);
  const [eliminandoRiga, setEliminandoRiga] = useState<SchedaEsercizioConNome | null>(null);
  const [eliminandoBlocco, setEliminandoBlocco] = useState<string | null>(null);
  const [rinominandoBlocco, setRinominandoBlocco] = useState<string | null>(null);
  const [nuovoNomeBlocco, setNuovoNomeBlocco] = useState("");

  function flattenIds(nuoviBlocchi: Blocco[]): string[] {
    return nuoviBlocchi.flatMap((b) => b.esercizi.map((e) => e.id));
  }

  async function applicaRiordino(nuoviBlocchi: Blocco[]) {
    await riordina(flattenIds(nuoviBlocchi));
    router.refresh();
  }

  async function spostaBlocco(index: number, direzione: -1 | 1) {
    const target = index + direzione;
    if (target < 0 || target >= blocchi.length) return;
    const copia = blocchi.slice();
    [copia[index], copia[target]] = [copia[target], copia[index]];
    await applicaRiordino(copia);
  }

  async function spostaEsercizio(bloccoIndex: number, esIndex: number, direzione: -1 | 1) {
    const target = esIndex + direzione;
    const blocco = blocchi[bloccoIndex];
    if (target < 0 || target >= blocco.esercizi.length) return;
    const esercizi = blocco.esercizi.slice();
    [esercizi[esIndex], esercizi[target]] = [esercizi[target], esercizi[esIndex]];
    const copia = blocchi.slice();
    copia[bloccoIndex] = { ...blocco, esercizi };
    await applicaRiordino(copia);
  }

  function handleBloccoDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocchi.findIndex((b) => b.nome === active.id);
    const newIndex = blocchi.findIndex((b) => b.nome === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    applicaRiordino(arrayMove(blocchi, oldIndex, newIndex));
  }

  function handleEsercizioDragEnd(bloccoIndex: number, event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const blocco = blocchi[bloccoIndex];
    const oldIndex = blocco.esercizi.findIndex((e) => e.id === active.id);
    const newIndex = blocco.esercizi.findIndex((e) => e.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const copia = blocchi.slice();
    copia[bloccoIndex] = { ...blocco, esercizi: arrayMove(blocco.esercizi, oldIndex, newIndex) };
    applicaRiordino(copia);
  }

  async function handleSalvaModale(fields: CampiModale) {
    if (modaleAperto?.modo === "modifica") {
      if (!fields.esercizio_id) {
        // Il modale in modifica offre comunque l'opzione "nuovo esercizio":
        // se scelta, va creato prima dell'update come nel percorso di aggiunta.
        await aggiungiEsercizio({ ...fields, scheda_id: scheda.id });
        await eliminaEsercizio(modaleAperto.riga.id);
      } else {
        await aggiornaEsercizio(modaleAperto.riga.id, { ...fields, esercizio_id: fields.esercizio_id });
      }
    } else {
      await aggiungiEsercizio({ ...fields, scheda_id: scheda.id });
    }
    setModaleAperto(null);
    router.refresh();
  }

  async function handleEliminaRiga() {
    if (!eliminandoRiga) return;
    await eliminaEsercizio(eliminandoRiga.id);
    setEliminandoRiga(null);
    router.refresh();
  }

  async function handleEliminaBlocco() {
    if (!eliminandoBlocco) return;
    await eliminaBlocco(scheda.id, eliminandoBlocco);
    setEliminandoBlocco(null);
    router.refresh();
  }

  async function handleRinominaBlocco() {
    if (!rinominandoBlocco || !nuovoNomeBlocco.trim()) return;
    await rinominaBlocco(scheda.id, rinominandoBlocco, nuovoNomeBlocco.trim());
    setRinominandoBlocco(null);
    setNuovoNomeBlocco("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/allenamenti/schede"
        className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Le mie schede
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Gestione scheda</h1>
          <p className="text-sm text-muted">{scheda.nome}</p>
        </div>
        <button
          type="button"
          onClick={() => setModaleAperto({ modo: "nuovo" })}
          className="btn-secondary flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Nuovo blocco
        </button>
      </div>

      {error && (
        <p className="text-sm text-spesa" role="alert">
          {error}
        </p>
      )}

      <DndContext sensors={sensors} onDragEnd={handleBloccoDragEnd}>
        <SortableContext items={nomiBlocchi} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-4">
            {blocchi.map((blocco, bloccoIndex) => (
              <SortableBlocco key={blocco.nome} id={blocco.nome}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <button type="button" onClick={() => spostaBlocco(bloccoIndex, -1)} disabled={bloccoIndex === 0} className="btn-icon !h-8 !w-8 disabled:opacity-30">
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => spostaBlocco(bloccoIndex, 1)}
                        disabled={bloccoIndex === blocchi.length - 1}
                        className="btn-icon !h-8 !w-8 disabled:opacity-30"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="font-display text-sm font-semibold">{blocco.nome}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setRinominandoBlocco(blocco.nome);
                        setNuovoNomeBlocco(blocco.nome);
                      }}
                      aria-label="Rinomina blocco"
                      className="btn-icon !h-6 !w-6"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModaleAperto({ modo: "nuovo", blocco: blocco.nome })}
                      className="btn-secondary flex items-center gap-1 !px-2 !py-1 text-xs"
                    >
                      <Plus className="h-3 w-3" />
                      Esercizio
                    </button>
                    <button
                      type="button"
                      onClick={() => setEliminandoBlocco(blocco.nome)}
                      aria-label="Elimina blocco"
                      className="btn-icon hover:!text-spesa"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <DndContext sensors={sensors} onDragEnd={(e) => handleEsercizioDragEnd(bloccoIndex, e)}>
                  <SortableContext
                    items={blocco.esercizi.map((e) => e.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <ul className="flex flex-col gap-1.5">
                      {blocco.esercizi.map((r, esIndex) => (
                        <SortableEsercizioRow key={r.id} id={r.id}>
                          <div className="flex min-w-0 items-center gap-2">
                            <div className="flex flex-col">
                              <button
                                type="button"
                                onClick={() => spostaEsercizio(bloccoIndex, esIndex, -1)}
                                disabled={esIndex === 0}
                                className="btn-icon !h-8 !w-8 disabled:opacity-30"
                              >
                                <ChevronUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => spostaEsercizio(bloccoIndex, esIndex, 1)}
                                disabled={esIndex === blocco.esercizi.length - 1}
                                className="btn-icon !h-8 !w-8 disabled:opacity-30"
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate font-medium">{r.esercizio_nome}</span>
                              <span className="truncate font-figures text-xs text-muted">{targetLabel(r)}</span>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setModaleAperto({ modo: "modifica", riga: r })}
                              aria-label="Modifica esercizio"
                              className="btn-icon"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEliminandoRiga(r)}
                              aria-label="Elimina esercizio"
                              className="btn-icon hover:!text-spesa"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </SortableEsercizioRow>
                      ))}
                    </ul>
                  </SortableContext>
                </DndContext>
              </SortableBlocco>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {modaleAperto && (
        <SchedaEsercizioModal
          riga={modaleAperto.modo === "modifica" ? modaleAperto.riga : null}
          blocchiEsistenti={nomiBlocchi}
          catalogo={catalogo}
          bloccoPreselezionato={modaleAperto.modo === "nuovo" ? modaleAperto.blocco : undefined}
          pending={pending}
          error={error}
          onSave={handleSalvaModale}
          onCancel={() => setModaleAperto(null)}
        />
      )}

      {eliminandoRiga && (
        <DeleteConfirmDialog
          titolo={eliminandoRiga.esercizio_nome}
          title="Eliminare questo esercizio dalla scheda?"
          description={
            <>
              &ldquo;{eliminandoRiga.esercizio_nome}&rdquo; verrà rimosso dal blocco &ldquo;{eliminandoRiga.blocco}&rdquo;.
              L&apos;esercizio resta nel catalogo, ma questa riga della scheda verrà eliminata definitivamente.
            </>
          }
          pending={pending}
          onConfirm={handleEliminaRiga}
          onCancel={() => setEliminandoRiga(null)}
        />
      )}

      {eliminandoBlocco && (
        <DeleteConfirmDialog
          titolo={eliminandoBlocco}
          title="Eliminare l'intero blocco?"
          description={
            <>
              Il blocco &ldquo;{eliminandoBlocco}&rdquo; e tutti i suoi{" "}
              {blocchi.find((b) => b.nome === eliminandoBlocco)?.esercizi.length ?? 0} esercizi verranno rimossi dalla
              scheda. L&apos;operazione non è reversibile.
            </>
          }
          pending={pending}
          onConfirm={handleEliminaBlocco}
          onCancel={() => setEliminandoBlocco(null)}
        />
      )}

      {rinominandoBlocco && (
        <div className="modal-overlay">
          <div className="modal-panel flex w-full max-w-sm flex-col gap-4 p-5">
            <h2 className="font-display text-base font-semibold">Rinomina blocco</h2>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted">Nome blocco</span>
              <input
                autoFocus
                value={nuovoNomeBlocco}
                onChange={(e) => setNuovoNomeBlocco(e.target.value)}
                className="field-input"
              />
            </label>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setRinominandoBlocco(null)} className="btn-secondary">
                Annulla
              </button>
              <button type="button" onClick={handleRinominaBlocco} disabled={pending} className="btn-primary">
                {pending ? "Salvataggio..." : "Salva"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrapper drag&drop per un blocco intero (header + lista esercizi): il
// bottone su/giù resta come alternativa accessibile (tastiera/screen
// reader), il grip è solo un secondo modo di fare la stessa azione.
function SortableBlocco({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="card flex flex-col gap-3 p-4"
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Trascina per riordinare il blocco"
          className="btn-icon !h-6 !w-6 shrink-0 cursor-grab touch-none active:cursor-grabbing"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

function SortableEsercizioRow({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
    >
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Trascina per riordinare l'esercizio"
          className="btn-icon !h-5 !w-5 shrink-0 cursor-grab touch-none active:cursor-grabbing"
        >
          <GripVertical className="h-3 w-3" />
        </button>
      </div>
      {children}
    </li>
  );
}
