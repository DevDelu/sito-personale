"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { ParlaConRadar } from "@/components/assistente/ParlaConRadar";
import { registraAperturaAssistente, type AperturaAssistente } from "@/lib/assistente/bus";

// Assistente a voce sopra qualsiasi pagina dell'area privata, aperto dal
// pulsante centrale della tab bar o dall'invito "Qualcosa non va?" dopo un
// errore (lib/assistente/bus.ts). Chiudere lo sheet spegne il microfono
// (ParlaConRadar smontato) e azzera la conversazione.
export function AssistenteHost() {
  const [apertura, setApertura] = useState<(AperturaAssistente & { chiave: number }) | null>(null);

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
