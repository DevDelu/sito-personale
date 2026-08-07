"use client";

import { useState } from "react";
import {
  aggiornaSchedaEsercizio,
  aggiungiSchedaEsercizio,
  eliminaBlocco,
  eliminaSchedaEsercizio,
  rinominaBlocco,
  riordinaSchedaEsercizi,
  type NuovoSchedaEsercizioInput,
  type SchedaEsercizioPatch,
} from "@/app/(private)/allenamenti/actions";

export function useSchedaMutations() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run<T>(fn: () => Promise<{ error?: string } & T>) {
    setPending(true);
    setError(null);
    const res = await fn();
    setPending(false);
    if (res?.error) {
      setError(res.error);
      throw new Error(res.error);
    }
    return res;
  }

  return {
    aggiornaEsercizio: (id: string, patch: SchedaEsercizioPatch) => run(() => aggiornaSchedaEsercizio(id, patch)),
    eliminaEsercizio: (id: string) => run(() => eliminaSchedaEsercizio(id)),
    aggiungiEsercizio: (input: NuovoSchedaEsercizioInput) => run(() => aggiungiSchedaEsercizio(input)),
    riordina: (idsInOrdine: string[]) => run(() => riordinaSchedaEsercizi(idsInOrdine)),
    rinominaBlocco: (schedaId: string, vecchioNome: string, nuovoNome: string) =>
      run(() => rinominaBlocco(schedaId, vecchioNome, nuovoNome)),
    eliminaBlocco: (schedaId: string, nome: string) => run(() => eliminaBlocco(schedaId, nome)),
    pending,
    error,
  };
}
