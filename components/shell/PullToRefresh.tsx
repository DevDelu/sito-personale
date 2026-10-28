"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { distanzaTirata, puoIniziarePull, superaSoglia } from "@/lib/pull-to-refresh";

// Tira giù per aggiornare i dati della pagina (router.refresh(), niente
// ricarica). Solo sotto 768px, a scroll in cima, mai con dialoghi aperti, su
// grafici/campi o in una sessione di allenamento. Il gesto non blocca lo scroll:
// il preventDefault scatta solo quando si sta davvero tirando verso il basso.
const ESCLUSI = "input, textarea, select, [data-no-pull], .recharts-wrapper, .fc";

// Un contenitore interno già scrollato (lista con overflow-y) deve poter tornare
// in cima prima che il gesto diventi un "tira per aggiornare".
function dentroScrollInterno(el: Element | null): boolean {
  for (let n = el; n && n !== document.body; n = n.parentElement) {
    if (n.scrollTop > 0) return true;
  }
  return false;
}

export function PullToRefresh() {
  const router = useRouter();
  const percorso = usePathname();
  const percorsoRef = useRef(percorso);
  const [tirata, setTirata] = useState(0);
  const [pending, startTransition] = useTransition();
  const tirataRef = useRef(0);

  useEffect(() => {
    percorsoRef.current = percorso;
  }, [percorso]);

  useEffect(() => {
    let inizioY: number | null = null;

    function reset() {
      inizioY = null;
      tirataRef.current = 0;
      setTirata(0);
    }

    function onStart(e: TouchEvent) {
      const attivo = document.activeElement;
      const bersaglio = e.target instanceof Element ? e.target : null;
      const ok = puoIniziarePull({
        scrollY: window.scrollY,
        touchMultipli: e.touches.length > 1,
        schermoStretto: window.matchMedia("(max-width: 767px)").matches,
        dialogoAperto: document.querySelector(".modal-overlay") !== null,
        percorso: percorsoRef.current,
        campoConFocus: attivo instanceof HTMLElement && (attivo.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(attivo.tagName)),
        bersaglioEscluso: !bersaglio || bersaglio.closest(ESCLUSI) !== null || dentroScrollInterno(bersaglio) || !document.querySelector(".app-shell"),
      });
      inizioY = ok ? e.touches[0].clientY : null;
    }

    function onMove(e: TouchEvent) {
      if (inizioY === null) return;
      const dy = e.touches[0].clientY - inizioY;
      if (dy <= 0 || window.scrollY > 0) {
        if (tirataRef.current !== 0) reset();
        return;
      }
      if (e.cancelable) e.preventDefault();
      const d = distanzaTirata(dy);
      tirataRef.current = d;
      setTirata(d);
    }

    function onEnd() {
      if (inizioY === null) return;
      const scatta = superaSoglia(tirataRef.current);
      reset();
      if (scatta) startTransition(() => router.refresh());
    }

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd, { passive: true });
    document.addEventListener("touchcancel", reset, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", reset);
    };
  }, [router]);

  if (tirata === 0 && !pending) return null;
  const y = pending ? 56 : tirata;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed left-1/2 z-40 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-surface shadow-sm md:hidden"
      style={{ top: `calc(env(safe-area-inset-top) + ${y - 20}px)`, opacity: pending ? 1 : Math.min(1, tirata / 40) }}
    >
      <RefreshCw
        className={`h-5 w-5 text-accent ${pending ? "animate-spin motion-reduce:animate-none" : ""}`}
        style={pending ? undefined : { transform: `rotate(${tirata * 4}deg)` }}
      />
    </div>
  );
}
