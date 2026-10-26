"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { dovrebbeRefresh } from "@/lib/app-refresh";

// Riaprendo la PWA dallo sfondo dopo qualche minuto, aggiorna i dati della
// pagina (router.refresh(): niente ricarica, lo scroll resta). Nessun output.
export function RefreshAlRitorno() {
  const router = useRouter();
  const percorso = usePathname();
  const percorsoRef = useRef(percorso);

  useEffect(() => {
    percorsoRef.current = percorso;
  }, [percorso]);

  useEffect(() => {
    let nascostaDal: number | null = null;
    let ultimoRefresh: number | null = null;

    function onVisibilita() {
      if (document.visibilityState === "hidden") {
        nascostaDal = Date.now();
        return;
      }
      const attivo = document.activeElement;
      const campoConFocus =
        attivo instanceof HTMLElement &&
        (attivo.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(attivo.tagName));
      const ora = Date.now();
      if (
        dovrebbeRefresh({
          ora,
          nascostaDal,
          ultimoRefresh,
          percorso: percorsoRef.current,
          campoConFocus,
          dialogoAperto: document.querySelector(".modal-overlay") !== null,
        })
      ) {
        ultimoRefresh = ora;
        router.refresh();
      }
      nascostaDal = null;
    }

    document.addEventListener("visibilitychange", onVisibilita);
    return () => document.removeEventListener("visibilitychange", onVisibilita);
  }, [router]);

  return null;
}
