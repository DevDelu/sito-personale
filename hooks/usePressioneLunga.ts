"use client";

import { useEffect, useRef, useState } from "react";

const DURATA_MS = 500;
const TOLLERANZA_PX = 10;

// Pressione lunga su un elemento di navigazione (tab bar): dopo ~500 ms
// senza spostare il dito oltre ~10px chiama onPressioneLunga, e il click
// sintetico che segue il rilascio viene annullato (niente navigazione).
// Se `abilitata` è false (tab non attiva) non parte nessun timer: resta un
// tap normale. onRilascio arriva dentro touchend/pointerup, cioè dentro un
// gesto dell'utente: è lì che si può dare il focus a un campo su iOS.
export function usePressioneLunga({
  abilitata,
  onPressioneLunga,
  onRilascio,
}: {
  abilitata: boolean;
  onPressioneLunga: () => void;
  onRilascio?: () => void;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inizio = useRef<{ x: number; y: number } | null>(null);
  const scattata = useRef(false);
  const [premuto, setPremuto] = useState(false);

  function annulla() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    inizio.current = null;
    setPremuto(false);
  }

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const handlers = {
    onPointerDown(e: React.PointerEvent) {
      scattata.current = false;
      if (!abilitata || (e.pointerType === "mouse" && e.button !== 0)) return;
      inizio.current = { x: e.clientX, y: e.clientY };
      setPremuto(true);
      timer.current = setTimeout(() => {
        timer.current = null;
        inizio.current = null;
        scattata.current = true;
        setPremuto(false);
        onPressioneLunga();
      }, DURATA_MS);
    },
    onPointerMove(e: React.PointerEvent) {
      if (!inizio.current) return;
      const dx = e.clientX - inizio.current.x;
      const dy = e.clientY - inizio.current.y;
      if (Math.hypot(dx, dy) > TOLLERANZA_PX) annulla();
    },
    onPointerUp(e: React.PointerEvent) {
      annulla();
      // Su touch il rilascio è gestito da touchend (vedi sotto), che iOS
      // considera un gesto utente valido per focus() e tastiera.
      if (scattata.current && e.pointerType !== "touch") onRilascio?.();
    },
    onPointerCancel: annulla,
    onPointerLeave(e: React.PointerEvent) {
      if (e.pointerType === "mouse") annulla();
    },
    onTouchEnd(e: React.TouchEvent) {
      if (!scattata.current) return;
      // Il dito si alza sopra lo sheet appena aperto: senza preventDefault
      // il browser invia i mouse event di compatibilità (mousedown/click)
      // all'overlay, che toglie il focus al campo appena ricevuto.
      e.preventDefault();
      onRilascio?.();
    },
    onContextMenu(e: React.MouseEvent) {
      if (abilitata) e.preventDefault();
    },
  };

  // Da chiamare in testa all'onClick: true se il click va ignorato perché
  // è il rilascio di una pressione lunga.
  function clickDaPressioneLunga(): boolean {
    if (!scattata.current) return false;
    scattata.current = false;
    return true;
  }

  return { handlers, premuto, clickDaPressioneLunga };
}
