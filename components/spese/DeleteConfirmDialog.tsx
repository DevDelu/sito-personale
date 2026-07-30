"use client";

export function DeleteConfirmDialog({
  titolo,
  pending,
  onConfirm,
  onCancel,
}: {
  titolo: string;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-5">
        <h2 className="font-display text-base font-semibold">Eliminare questo movimento?</h2>
        <p className="mt-1 text-sm text-muted">
          &ldquo;{titolo}&rdquo; verrà rimosso definitivamente. L&apos;operazione non è reversibile.
        </p>
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="rounded-full bg-spesa px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Eliminazione..." : "Elimina"}
          </button>
        </div>
      </div>
    </div>
  );
}
