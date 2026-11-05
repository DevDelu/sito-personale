"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

// Menu di condivisione nativo dove esiste `navigator.share` (iPhone, Android);
// altrimenti copia il link negli appunti e lo conferma in una regione `status`.
export function ShareButton({ title, color }: { title: string; color: string }) {
  const t = useTranslations("CaseStudy");
  const [copiato, setCopiato] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function condividi() {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
      } catch {
        // Annullato dall'utente (AbortError) o non disponibile: nessun errore da mostrare.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiato(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopiato(false), 2500);
    } catch {
      // Appunti non disponibili: niente da fare.
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={condividi}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 py-2 font-mono text-sm transition-transform duration-150 ease-out hover:-translate-y-0.5 active:scale-95"
        style={{ borderColor: color, color }}
      >
        {t("share")}
      </button>
      <span role="status" className="font-mono text-xs text-muted">
        {copiato ? t("shareCopied") : ""}
      </span>
    </div>
  );
}
