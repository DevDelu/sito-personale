"use client";

import { useTranslations } from "next-intl";
import { completo, TOTALE_SFERE } from "@/lib/sfere/conteggio";
import { useSfere } from "./use-sfere";

// Compare solo dopo la prima sfera. In basso a sinistra, lontano dai CTA e
// dalla safe-area. Alla settima mostra un messaggio breve, solo CSS.
export function ContatoreSfere() {
  const t = useTranslations("Sfere");
  const { raccolte } = useSfere();
  if (raccolte.length === 0) return null;
  const fatto = completo(raccolte);
  return (
    <div
      role="status"
      className="pointer-events-none fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-30 flex max-w-[16rem] flex-col gap-1"
    >
      <span className="sfere-contatore w-fit rounded-full border border-border bg-surface/90 px-3 py-1 font-mono text-xs text-foreground backdrop-blur">
        {t("contatore", { n: raccolte.length, totale: TOTALE_SFERE })}
      </span>
      {fatto && (
        <span className="sfere-desiderio rounded-xl border border-accent bg-surface px-3 py-2 text-sm text-foreground shadow-lg">
          {t("completo")}
        </span>
      )}
    </div>
  );
}
