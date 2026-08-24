"use client";

import { useRef } from "react";
import { Bold, Italic, List, ListOrdered, Trash2, Underline as UnderlineIcon } from "lucide-react";

const COMANDI: { comando: string; icona: typeof Bold; label: string }[] = [
  { comando: "bold", icona: Bold, label: "Grassetto" },
  { comando: "italic", icona: Italic, label: "Corsivo" },
  { comando: "underline", icona: UnderlineIcon, label: "Sottolineato" },
  { comando: "insertUnorderedList", icona: List, label: "Elenco puntato" },
  { comando: "insertOrderedList", icona: ListOrdered, label: "Elenco numerato" },
];

function formatDataLunga(data: string): string {
  return new Date(`${data}T00:00:00Z`).toLocaleDateString("it-IT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

// Editor rich-text minimale via contentEditable + execCommand: per una nota
// personale (grassetto/corsivo/sottolineato/elenchi) non serve una libreria
// WYSIWYG intera. Il contenuto viaggia/si salva come HTML.
export function NotaModal({
  data,
  contenutoIniziale,
  pending,
  onSave,
  onRimuovi,
  onClose,
}: {
  data: string;
  contenutoIniziale: string;
  pending: boolean;
  onSave: (html: string) => void;
  onRimuovi: () => void;
  onClose: () => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);

  function exec(comando: string) {
    editorRef.current?.focus();
    document.execCommand(comando);
  }

  function salva() {
    onSave(editorRef.current?.innerHTML ?? "");
  }

  return (
    <div className="modal-overlay">
      <div className="modal-panel flex w-full max-w-lg flex-col gap-3 p-5">
        <h2 className="font-display text-base font-semibold capitalize">Nota &middot; {formatDataLunga(data)}</h2>

        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border p-1">
          {COMANDI.map(({ comando, icona: Icona, label }) => (
            <button
              key={comando}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => exec(comando)}
              aria-label={label}
              title={label}
              className="btn-icon"
            >
              <Icona className="h-4 w-4" />
            </button>
          ))}
        </div>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="field-input min-h-[220px] text-sm [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: contenutoIniziale }}
        />

        <div className="flex items-center justify-between gap-3">
          {contenutoIniziale ? (
            <button
              type="button"
              onClick={onRimuovi}
              disabled={pending}
              className="btn-secondary flex items-center gap-1.5 !text-spesa"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Rimuovi nota
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">
              Chiudi
            </button>
            <button type="button" onClick={salva} disabled={pending} className="btn-primary">
              {pending ? "Salvataggio..." : "Salva"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
