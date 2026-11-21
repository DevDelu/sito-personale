"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

// Turnstile (script Cloudflare + iframe della sfida) in fondo alla home costa
// parecchio sul thread principale: lo carichiamo solo quando il riquadro sta
// per entrare nel viewport (o al primo focus nel form), non a ogni apertura
// della pagina. Il segnaposto tiene l'altezza per non causare layout shift.
export function TurnstileLazy({ siteKey }: { siteKey?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [attivo, setAttivo] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || attivo) return;
    const form = el.closest("form");
    const attiva = () => setAttivo(true);
    form?.addEventListener("focusin", attiva, { once: true });
    if (typeof IntersectionObserver === "undefined") {
      attiva();
      return () => form?.removeEventListener("focusin", attiva);
    }
    const obs = new IntersectionObserver(
      (voci) => {
        if (voci.some((v) => v.isIntersecting)) attiva();
      },
      { rootMargin: "300px" },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      form?.removeEventListener("focusin", attiva);
    };
  }, [attivo]);

  return (
    <div ref={ref} className="min-h-[65px]">
      {attivo && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
          <div className="cf-turnstile" data-sitekey={siteKey} data-theme="auto" />
        </>
      )}
    </div>
  );
}
