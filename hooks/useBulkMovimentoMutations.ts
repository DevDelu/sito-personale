"use client";

import { useState } from "react";
import type { TipoCategoria } from "@/lib/types";

export type BulkMovimentoItem = { id: string; tipo: TipoCategoria };

export type BulkMovimentoPatch = {
  categoria_id?: string;
  tipo?: TipoCategoria;
  descrizione?: string | null;
  data?: string;
  importo?: number;
};

async function request(init: RequestInit) {
  const res = await fetch("/api/movimenti/bulk", {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Errore durante l'operazione.");
  return json;
}

// Un'unica chiamata batch per operazione (`.in('id', [...])` lato server),
// mai un giro di chiamate per riga selezionata.
export function useBulkMovimentoMutations() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function bulkUpdate(items: BulkMovimentoItem[], patch: BulkMovimentoPatch) {
    setPending(true);
    setError(null);
    try {
      await request({ method: "PATCH", body: JSON.stringify({ items, patch }) });
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setPending(false);
    }
  }

  async function bulkDelete(items: BulkMovimentoItem[]) {
    setPending(true);
    setError(null);
    try {
      await request({ method: "DELETE", body: JSON.stringify({ items }) });
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setPending(false);
    }
  }

  return { bulkUpdate, bulkDelete, pending, error };
}
