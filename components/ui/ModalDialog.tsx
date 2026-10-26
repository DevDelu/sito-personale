"use client";

import { useEffect, useRef } from "react";
import { etichettaAreaBreve } from "@/lib/feedback/aree";

const FOCUSABILI =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Overlay dei modali "grezzi" (`modal-overlay` + `modal-panel`): aggiunge ciò
// che gli Sheet hanno già (issue #150) senza toccare il contenuto — role=dialog,
// aria-modal e nome accessibile sul `.modal-panel`, focus dentro il pannello,
// Tab che resta dentro, Esc che chiude, ritorno del focus a chi aveva aperto,
// scroll del body bloccato. Il click sullo sfondo NON chiude (i form perderebbero
// i dati per un tocco sbagliato).
export function ModalDialog({
  onClose,
  children,
  etichetta,
}: {
  onClose: () => void;
  children: React.ReactNode;
  etichetta?: string;
}) {
  const overlay = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const radice = overlay.current;
    const pannello = radice?.querySelector<HTMLElement>(".modal-panel");
    if (!radice || !pannello) return;

    const precedente = document.activeElement as HTMLElement | null;
    pannello.setAttribute("role", "dialog");
    pannello.setAttribute("aria-modal", "true");
    if (!pannello.hasAttribute("aria-label")) {
      const nome =
        etichetta ??
        etichettaAreaBreve(pannello.getAttribute("data-fb-area")) ??
        pannello.querySelector("h1, h2, h3")?.textContent?.trim();
      if (nome) pannello.setAttribute("aria-label", nome);
    }
    if (!pannello.contains(document.activeElement)) {
      // Il campo con autoFocus ha già il focus: non lo si ruba.
      if (!pannello.hasAttribute("tabindex")) pannello.setAttribute("tabindex", "-1");
      pannello.focus({ preventScroll: true });
    }

    const overflowPrima = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (!pannello) return;
      // Con più modali impilati risponde solo quello in cima.
      const tutti = document.querySelectorAll(".modal-overlay");
      if (tutti[tutti.length - 1] !== radice) return;
      // "Indica il punto" del feedback: l'Esc serve a annullare la selezione
      // (listener su window), non a chiudere il modale sotto e perdere i dati.
      if (document.querySelector("[data-fb-barra-punto]")) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const elementi = [...pannello.querySelectorAll<HTMLElement>(FOCUSABILI)].filter((el) => el.offsetParent !== null);
      if (elementi.length === 0) {
        e.preventDefault();
        return;
      }
      const primo = elementi[0];
      const ultimo = elementi[elementi.length - 1];
      const attivo = document.activeElement;
      if (e.shiftKey && (attivo === primo || attivo === pannello || !pannello.contains(attivo))) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && (attivo === ultimo || !pannello.contains(attivo))) {
        e.preventDefault();
        primo.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = overflowPrima;
      if (precedente && document.contains(precedente)) precedente.focus({ preventScroll: true });
    };
  }, [etichetta]);

  return (
    <div ref={overlay} className="modal-overlay">
      {children}
    </div>
  );
}
