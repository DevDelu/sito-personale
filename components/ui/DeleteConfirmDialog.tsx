"use client";

export function DeleteConfirmDialog({
  titolo,
  count,
  pending,
  onConfirm,
  onCancel,
  title,
  description,
}: {
  titolo: string;
  // Se >1, mostra il testo per l'eliminazione in blocco invece del singolo movimento.
  count?: number;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  // Override per contesti diversi da "movimento" (es. Carte): il default è
  // pensato per Spese/Investimenti, dove questo dialog è nato.
  title?: string;
  description?: React.ReactNode;
}) {
  const isBulk = typeof count === "number" && count > 1;

  return (
    <div className="modal-overlay">
      <div className="modal-panel w-full max-w-sm p-5">
        <h2 className="font-display text-base font-semibold">
          {title ?? (isBulk ? `Eliminare ${count} movimenti?` : "Eliminare questo movimento?")}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {description ??
            (isBulk ? (
              `Le ${count} righe selezionate verranno rimosse definitivamente. L'operazione non è reversibile.`
            ) : (
              <>&ldquo;{titolo}&rdquo; verrà rimosso definitivamente. L&apos;operazione non è reversibile.</>
            ))}
        </p>
        <div className="mt-4 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Annulla
          </button>
          <button type="button" onClick={onConfirm} disabled={pending} className="btn-danger">
            {pending ? "Eliminazione..." : "Elimina"}
          </button>
        </div>
      </div>
    </div>
  );
}
