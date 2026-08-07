"use client";

import { useState } from "react";
import {
  aggiornaSessione,
  aggiornaSessioneLog,
  aggiornaSessioniBulk,
  eliminaSessione,
  eliminaSessioneLog,
  eliminaSessioniBulk,
  type BulkSessionePatch,
  type FineSessionePatch,
  type LogSeriePatch,
} from "@/app/(private)/allenamenti/actions";

export function useStoricoMutations() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<{ error?: string }>) {
    setPending(true);
    setError(null);
    const res = await fn();
    setPending(false);
    if (res?.error) {
      setError(res.error);
      throw new Error(res.error);
    }
  }

  return {
    aggiornaSessione: (id: string, patch: FineSessionePatch) => run(() => aggiornaSessione(id, patch)),
    eliminaSessione: (id: string) => run(() => eliminaSessione(id)),
    aggiornaLog: (id: string, patch: Omit<LogSeriePatch, "scheda_esercizio_id">) =>
      run(() => aggiornaSessioneLog(id, patch)),
    eliminaLog: (id: string) => run(() => eliminaSessioneLog(id)),
    bulkAggiorna: (ids: string[], patch: BulkSessionePatch) => run(() => aggiornaSessioniBulk(ids, patch)),
    bulkElimina: (ids: string[]) => run(() => eliminaSessioniBulk(ids)),
    pending,
    error,
  };
}
