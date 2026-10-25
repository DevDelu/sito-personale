"use client";

import { useEffect, useRef, useState } from "react";
import { Bold, Italic, List, ListOrdered, Underline as UnderlineIcon } from "lucide-react";

const COMANDI: { comando: string; icona: typeof Bold; label: string }[] = [
  { comando: "bold", icona: Bold, label: "Grassetto" },
  { comando: "italic", icona: Italic, label: "Corsivo" },
  { comando: "underline", icona: UnderlineIcon, label: "Sottolineato" },
  { comando: "insertUnorderedList", icona: List, label: "Elenco puntato" },
  { comando: "insertOrderedList", icona: ListOrdered, label: "Elenco numerato" },
];

// Nota del giorno modificabile direttamente sul testo (contentEditable +
// execCommand, come prima nel modale): si tocca il testo e si scrive, il
// salvataggio parte da solo quando si esce dal campo. Il contenuto è HTML.
export function NotaInline({
  contenutoIniziale,
  onSave,
}: {
  contenutoIniziale: string;
  onSave: (html: string) => Promise<void>;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const ultimoSalvato = useRef(contenutoIniziale);
  const barraToccata = useRef(false);
  const [attiva, setAttiva] = useState(false);
  const [stato, setStato] = useState<"fermo" | "salvataggio" | "salvato" | "errore">("fermo");

  function exec(comando: string) {
    editorRef.current?.focus();
    document.execCommand(comando);
  }

  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Contenuto di partenza fissato al mount: dopo il salvataggio non si riscrive l'innerHTML
  // (il caret non salta e il testo digitato nel frattempo non si perde).
  const [htmlIniziale] = useState(contenutoIniziale);

  useEffect(() => {
    const salvaSubito = () => void salva();
    const alNascondere = () => {
      if (document.visibilityState === "hidden") salvaSubito();
    };
    window.addEventListener("pagehide", salvaSubito);
    document.addEventListener("visibilitychange", alNascondere);
    return () => {
      window.removeEventListener("pagehide", salvaSubito);
      document.removeEventListener("visibilitychange", alNascondere);
      if (timer.current) clearTimeout(timer.current);
      salvaSubito(); // cambio scheda/giorno: salva quello che non è ancora salvato
    };
  }, []);

  async function salva() {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const testo = html.replace(/<[^>]*>/g, "").trim();
    const daSalvare = testo.length === 0 ? "" : html;
    if (daSalvare === ultimoSalvato.current) return;
    setStato("salvataggio");
    try {
      await onSaveRef.current(daSalvare);
      ultimoSalvato.current = daSalvare;
      setStato("salvato");
    } catch {
      setStato("errore");
    }
  }

  return (
    <div
      data-fb-area="agenda.nota"
      className="flex flex-col gap-2"
      onBlur={(e) => {
        // l'uscita vera dal blocco (non il passaggio tra editor e barra strumenti)
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        if (e.relatedTarget === null && barraToccata.current) return; // iOS: i bottoni non prendono il focus
        setAttiva(false);
        void salva();
      }}
    >
      {attiva && (
        <div
          className="flex flex-wrap items-center gap-1 rounded-lg border border-border p-1"
          onPointerDown={() => {
            barraToccata.current = true;
            setTimeout(() => (barraToccata.current = false), 400);
          }}
        >
          {COMANDI.map(({ comando, icona: Icona, label }) => (
            <button
              key={comando}
              type="button"
              onPointerDown={(e) => e.preventDefault()}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => exec(comando)}
              aria-label={label}
              title={label}
              className="btn-icon min-h-11 min-w-11"
            >
              <Icona className="h-4 w-4" />
            </button>
          ))}
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Nota del giorno"
        data-placeholder="Tocca qui per scrivere una nota"
        onFocus={() => {
          setAttiva(true);
          setStato("fermo");
        }}
        className="field-input min-h-[120px] text-[17px] empty:before:text-muted empty:before:content-[attr(data-placeholder)] md:text-sm [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
        onInput={() => {
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => void salva(), 1500);
        }}
        onPaste={(e) => {
          e.preventDefault();
          document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
        }}
        dangerouslySetInnerHTML={{ __html: htmlIniziale }}
      />

      <p className="min-h-4 text-[13px] text-muted" aria-live="polite">
        {stato === "salvataggio" && "Salvataggio..."}
        {stato === "salvato" && "Salvato"}
        {stato === "errore" && "Non salvata: tocca di nuovo il testo e riprova"}
      </p>
    </div>
  );
}
