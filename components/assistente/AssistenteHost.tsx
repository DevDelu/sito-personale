"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Sheet } from "@/components/ui/Sheet";
import { registraAperturaAssistente, type AperturaAssistente } from "@/lib/assistente/bus";

// ParlaConRadar (hook voce, VAD, sintesi) pesa ~30 KB di sorgente e stava nel JS
// di ogni pagina privata. Il chunk si scarica a browser inattivo (vedi effetto),
// così al tap è già pronto e il microfono parte nel gesto come prima (gotcha iOS).
const caricaParla = () => import("@/components/assistente/ParlaConRadar").then((m) => m.ParlaConRadar);
const ParlaConRadar = dynamic(caricaParla);

// Assistente a voce sopra qualsiasi pagina dell'area privata, aperto dal
// pulsante centrale della tab bar o dall'invito "Qualcosa non va?" dopo un
// errore (lib/assistente/bus.ts). Chiudere lo sheet spegne il microfono
// (ParlaConRadar smontato) e azzera la conversazione.
export function AssistenteHost() {
  const [apertura, setApertura] = useState<(AperturaAssistente & { chiave: number }) | null>(null);

  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 2000));
    idle(() => void caricaParla());
  }, []);

  useEffect(() => {
    registraAperturaAssistente((a) => setApertura({ ...a, chiave: Date.now() }));
    return () => registraAperturaAssistente(null);
  }, []);

  if (!apertura) return null;
  return (
    <Sheet onClose={() => setApertura(null)} area="shell.assistente" posizione="alto" className="!p-0">
      <h2 className="sr-only">Assistente</h2>
      <ParlaConRadar
        key={apertura.chiave}
        pagina={apertura.pagina}
        attrito={apertura.attrito}
        avvioAutomatico
        inSheet
      />
    </Sheet>
  );
}
