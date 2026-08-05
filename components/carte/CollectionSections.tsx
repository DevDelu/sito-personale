"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HeroCards } from "./HeroCards";
import { AltreCarteList } from "./AltreCarteList";
import { CardEditModal } from "./CardEditModal";
import { CardDetailModal } from "./CardDetailModal";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { useCarteMutations } from "@/hooks/useCarteMutations";
import type { ModificaCartaPatch } from "@/app/(private)/carte/actions";
import type { CollectionCard } from "@/lib/carte/types";

export function CollectionSections({
  hero,
  resto,
  metricsSlot,
}: {
  hero: CollectionCard[];
  resto: CollectionCard[];
  metricsSlot: React.ReactNode;
}) {
  const router = useRouter();
  const { updateCarta, deleteCarta, pending, error } = useCarteMutations();
  const [viewing, setViewing] = useState<CollectionCard | null>(null);
  const [editing, setEditing] = useState<CollectionCard | null>(null);
  const [deleting, setDeleting] = useState<CollectionCard | null>(null);

  async function handleSave(patch: ModificaCartaPatch) {
    if (!editing) return;
    await updateCarta(editing.id, editing.card_id, patch);
    setEditing(null);
    router.refresh();
  }

  async function handleDelete() {
    if (!deleting) return;
    await deleteCarta(deleting.id);
    setDeleting(null);
    router.refresh();
  }

  return (
    <>
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-medium text-muted">Le tue carte di valore</h2>
        <HeroCards carte={hero} onView={setViewing} onEdit={setEditing} onDelete={setDeleting} />
      </section>

      {metricsSlot}

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-medium text-muted">Altre carte</h2>
        <AltreCarteList carte={resto} onView={setViewing} onEdit={setEditing} onDelete={setDeleting} />
      </section>

      {viewing && (
        <CardDetailModal
          carta={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => {
            setEditing(viewing);
            setViewing(null);
          }}
          onDelete={() => {
            setDeleting(viewing);
            setViewing(null);
          }}
        />
      )}

      {editing && (
        <CardEditModal
          carta={editing}
          pending={pending}
          error={error}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      {deleting && (
        <DeleteConfirmDialog
          titolo={deleting.name}
          title="Eliminare questa carta?"
          description={
            <>
              &ldquo;{deleting.name}&rdquo; verrà rimossa dalla collezione. L&apos;operazione non è reversibile.
            </>
          }
          pending={pending}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
