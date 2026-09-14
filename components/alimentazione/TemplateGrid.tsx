"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { useTemplateMutations } from "@/hooks/useTemplateMutations";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { TemplateEditModal, type TemplateSavePayload } from "./TemplateEditModal";
import type { Alimento, TemplatePasto, TipoPasto } from "@/lib/alimentazione/types";

const GIORNI: { value: number; label: string }[] = [
  { value: 1, label: "Lunedì" },
  { value: 2, label: "Martedì" },
  { value: 3, label: "Mercoledì" },
  { value: 4, label: "Giovedì" },
  { value: 5, label: "Venerdì" },
  { value: 6, label: "Sabato" },
  { value: 7, label: "Domenica" },
];

const TIPI: { value: TipoPasto; label: string }[] = [
  { value: "colazione", label: "Colazione" },
  { value: "pranzo", label: "Pranzo" },
  { value: "cena", label: "Cena" },
  { value: "spuntino", label: "Spuntino" },
];

// giorno: null = jolly (non legato a una cella della griglia, vedi
// TemplateEditModal). jollyId identifica quale jolly esistente si sta
// modificando (assente = si sta creando un jolly nuovo).
type Cella = { giorno: number; tipoPasto: TipoPasto } | { giorno: null; tipoPasto: TipoPasto; jollyId?: string };

export function TemplateGrid({ templates, alimenti }: { templates: TemplatePasto[]; alimenti: Alimento[] }) {
  const router = useRouter();
  const { creaTemplate, updateTemplate, deleteTemplate, pending, error } = useTemplateMutations();
  const [editing, setEditing] = useState<Cella | null>(null);
  const [deleting, setDeleting] = useState<TemplatePasto | null>(null);

  const alimentiById = new Map(alimenti.map((a) => [a.id, a]));
  const jolly = templates.filter((t) => t.giorno_settimana === null);

  function templateFor(giorno: number, tipoPasto: TipoPasto): TemplatePasto | null {
    return templates.find((t) => t.giorno_settimana === giorno && t.tipo_pasto === tipoPasto) ?? null;
  }

  function templateInModifica(): TemplatePasto | null {
    if (!editing) return null;
    if (editing.giorno === null) return jolly.find((t) => t.id === editing.jollyId) ?? null;
    return templateFor(editing.giorno, editing.tipoPasto);
  }

  async function handleSave(payload: TemplateSavePayload) {
    if (!editing) return;
    const esistente = templateInModifica();
    if (esistente) {
      await updateTemplate(esistente.id, payload);
    } else {
      await creaTemplate({
        giornoSettimana: editing.giorno,
        tipoPasto: editing.tipoPasto,
        ...payload,
      });
    }
    setEditing(null);
    router.refresh();
  }

  async function handleDelete() {
    if (!deleting) return;
    await deleteTemplate(deleting.id);
    setDeleting(null);
    setEditing(null);
    router.refresh();
  }

  const cellaInModifica = templateInModifica();

  return (
    <>
      <div className="overflow-x-auto">
        <div className="grid min-w-[900px] grid-cols-[120px_repeat(7,1fr)] gap-2">
          <div />
          {GIORNI.map((g) => (
            <div key={g.value} className="px-2 text-center text-xs font-medium uppercase tracking-wide text-muted">
              {g.label}
            </div>
          ))}

          {TIPI.map((tipo) => (
            <Fragment key={tipo.value}>
              <div className="flex items-center px-2 text-sm font-medium text-muted">{tipo.label}</div>
              {GIORNI.map((g) => {
                const template = templateFor(g.value, tipo.value);
                return (
                  <button
                    key={`${tipo.value}-${g.value}`}
                    type="button"
                    onClick={() => setEditing({ giorno: g.value, tipoPasto: tipo.value })}
                    className="card card-hover flex min-h-[90px] flex-col gap-1 p-2.5 text-left text-xs"
                  >
                    {template ? (
                      <>
                        <span className="text-sm font-medium leading-snug">{template.nome}</span>
                        {template.composizione.length > 0 ? (
                          <span className="text-muted">
                            {template.composizione
                              .map((c) => {
                                const alimento = alimentiById.get(c.alimento_id);
                                return `${alimento?.nome ?? "?"} ${c.quantita_g}g`;
                              })
                              .join(" · ")}
                          </span>
                        ) : (
                          <span className="italic text-muted">Nessuna composizione fissa</span>
                        )}
                      </>
                    ) : (
                      <span className="m-auto text-muted">+ Aggiungi</span>
                    )}
                  </button>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-display text-base font-semibold">Jolly</h2>
            <p className="text-sm text-muted">
              Alternative veloci non legate a un giorno fisso, selezionabili manualmente dal quick-add.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing({ giorno: null, tipoPasto: "pranzo" })}
            className="btn-secondary !px-3 !py-1.5 text-xs"
          >
            + Nuovo jolly
          </button>
        </div>

        {jolly.length > 0 && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {jolly.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setEditing({ giorno: null, tipoPasto: t.tipo_pasto, jollyId: t.id })}
                className="card card-hover flex flex-col gap-1 p-2.5 text-left text-xs"
              >
                <span className="text-sm font-medium leading-snug">{t.nome}</span>
                <span className="text-muted">
                  {TIPI.find((tp) => tp.value === t.tipo_pasto)?.label} ·{" "}
                  {t.composizione.length > 0
                    ? t.composizione
                        .map((c) => {
                          const alimento = alimentiById.get(c.alimento_id);
                          return `${alimento?.nome ?? "?"} ${c.quantita_g}g`;
                        })
                        .join(" · ")
                    : "Nessuna composizione fissa"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <TemplateEditModal
          giornoSettimana={editing.giorno}
          tipoPasto={editing.tipoPasto}
          template={cellaInModifica}
          alimenti={alimenti}
          pending={pending}
          error={error}
          onSave={handleSave}
          onDelete={cellaInModifica ? () => setDeleting(cellaInModifica) : undefined}
          onCancel={() => setEditing(null)}
        />
      )}

      {deleting && (
        <DeleteConfirmDialog
          titolo={deleting.nome}
          pending={pending}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          title="Eliminare questo template?"
          description={
            <>
              &ldquo;{deleting.nome}&rdquo; verrà rimosso definitivamente dalla griglia. L&apos;operazione non è
              reversibile.
            </>
          }
        />
      )}
    </>
  );
}
