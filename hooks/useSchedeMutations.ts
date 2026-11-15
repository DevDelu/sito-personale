"use client";

import { useState } from "react";
import {
  aggiornaScheda,
  archiviaScheda,
  creaScheda,
  duplicaScheda,
  eliminaScheda,
  type SchedaPatch,
} from "@/app/(private)/allenamenti/actions";

export function useSchedeMutations() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run<T>(fn: () => Promise<{ error?: string } & T>) {
    setPending(true);
    setError(null);
    let res;
    try {
      res = await fn();
    } catch (e) {
      // Azione rifiutata o rete assente: senza questo `pending` restava true
      // e i pulsanti restavano disattivati fino al ricaricamento.
      setError("Operazione non riuscita. Riprova.");
      throw e;
    } finally {
      setPending(false);
    }
    if (res?.error) {
      setError(res.error);
      throw new Error(res.error);
    }
    return res;
  }

  return {
    creaScheda: (patch: SchedaPatch) => run(() => creaScheda(patch)),
    aggiornaScheda: (id: string, patch: SchedaPatch) => run(() => aggiornaScheda(id, patch)),
    duplicaScheda: (id: string) => run(() => duplicaScheda(id)),
    eliminaScheda: (id: string) => run(() => eliminaScheda(id)),
    archiviaScheda: (id: string, archiviata: boolean) => run(() => archiviaScheda(id, archiviata)),
    pending,
    error,
  };
}
