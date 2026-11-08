"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { distanzaVisibile, gestoAbilitato, superaSoglia } from "@/lib/pull-to-refresh";

// "Tira giù per aggiornare" per la PWA su iPhone (in standalone non esiste
// quello del browser). A pagina in cima, tirando oltre la soglia e rilasciando
// parte router.refresh(). Mai preventDefault: lo scroll nativo non cambia.
function inScrollOrizzontale(el: EventTarget | null): boolean {
  let n = el instanceof HTMLElement ? el : null;
  while (n && n !== document.body) {
    if (n.scrollWidth > n.clientWidth + 1 && /(auto|scroll)/.test(getComputedStyle(n).overflowX)) return true;
    if (n.classList.contains("recharts-wrapper")) return true;
    n = n.parentElement;
  }
  return false;
}

export function PullToRefresh() {
  const router = useRouter();
  const percorso = usePathname();
  const percorsoRef = useRef(percorso);
  const [tirata, setTirata] = useState(0);
  const [aggiorno, setAggiorno] = useState(false);

  useEffect(() => {
    percorsoRef.current = percorso;
  }, [percorso]);

  useEffect(() => {
    let startY: number | null = null;
    let delta = 0;

    function onStart(e: TouchEvent) {
      startY = null;
      delta = 0;
      if (e.touches.length !== 1) return;
      const attivo = document.activeElement;
      const campoConFocus =
        attivo instanceof HTMLElement &&
        (attivo.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(attivo.tagName));
      const ok = gestoAbilitato({
        scrollY: window.scrollY,
        larghezza: window.innerWidth,
        percorso: percorsoRef.current,
        dialogoAperto: document.querySelector('.modal-overlay, [aria-modal="true"]') !== null,
        campoConFocus,
      });
      if (ok && !inScrollOrizzontale(e.target)) startY = e.touches[0].clientY;
    }

    function onMove(e: TouchEvent) {
      if (startY === null) return;
      delta = e.touches[0].clientY - startY;
      if (window.scrollY > 0) delta = 0;
      setTirata(distanzaVisibile(delta));
    }

    function onEnd() {
      if (startY === null) return;
      const vai = superaSoglia(delta);
      startY = null;
      delta = 0;
      setTirata(0);
      if (vai) {
        setAggiorno(true);
        router.refresh();
        window.setTimeout(() => setAggiorno(false), 900);
      }
    }

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    document.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
    };
  }, [router]);

  const visibile = tirata > 8 || aggiorno;
  if (!visibile) return <span role="status" className="sr-only" />;
  return (
    <div
      role="status"
      aria-label={aggiorno ? "Aggiornamento in corso" : "Rilascia per aggiornare"}
      className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center md:hidden"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 8px)" }}
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-muted shadow-md ring-1 ring-[var(--app-hairline)]"
        style={{ transform: `translateY(${aggiorno ? 8 : tirata - 20}px)`, opacity: aggiorno ? 1 : Math.min(1, tirata / 50) }}
      >
        <RefreshCw className={`h-4 w-4 ${aggiorno ? "motion-safe:animate-spin" : ""}`} aria-hidden />
      </span>
    </div>
  );
}
