"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (contenitore: HTMLElement, opzioni: { sitekey: string; theme: "auto" }) => string | undefined;
      reset: (widget: string) => void;
      remove: (widget: string) => void;
    };
  }
}

// Un solo indirizzo per tutti i moduli: next/script lo carica una volta sola.
const SCRIPT_TURNSTILE = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

// Turnstile disegnato "a mano" a ogni montaggio. Il disegno automatico avviene
// solo quando lo script viene eseguito la prima volta: arrivando su un modulo
// da un link interno (es. "Password dimenticata?") il riquadro non compariva e
// l'invio veniva respinto dal controllo anti-spam.
//
// `esito` è lo stato restituito da useActionState: il token vale una sola volta,
// anche quando il server risponde con un errore, quindi dopo ogni risposta si
// rinnova.
export function WidgetAntispam({
  siteKey,
  esito,
  strategy = "afterInteractive",
}: {
  siteKey?: string;
  esito: unknown;
  strategy?: "afterInteractive" | "lazyOnload";
}) {
  const contenitore = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);

  // Si aspetta window.turnstile invece di affidarsi a onReady di next/script:
  // se il modulo si monta mentre lo script è ancora in arrivo (link toccato
  // subito, rete lenta) onReady non viene mai chiamato e il riquadro manca.
  useEffect(() => {
    if (!siteKey) return;
    const disegna = () => {
      if (!window.turnstile || !contenitore.current) return false;
      widget.current ??= window.turnstile.render(contenitore.current, { sitekey: siteKey, theme: "auto" }) ?? null;
      return true;
    };
    if (disegna()) return;
    const attesa = setInterval(() => {
      if (disegna()) clearInterval(attesa);
    }, 200);
    return () => clearInterval(attesa);
  }, [siteKey]);

  useEffect(
    () => () => {
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    },
    [],
  );

  useEffect(() => {
    if (esito && widget.current) window.turnstile?.reset(widget.current);
  }, [esito]);

  return (
    <>
      <Script src={SCRIPT_TURNSTILE} strategy={strategy} />
      <div ref={contenitore} className="min-h-[65px]" />
    </>
  );
}
