"use client";

import { useState } from "react";
import type { CostoTipo } from "@/lib/investimenti/types";

async function request(path: string, init: RequestInit) {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Errore durante l'operazione.");
  return json;
}

export function useBulkTransazioneMutations() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function bulkUpdateCostoTipo(ids: string[], costo_tipo: CostoTipo) {
    setPending(true);
    setError(null);
    try {
      return await request("/api/investimenti/transazioni/bulk", {
        method: "PATCH",
        body: JSON.stringify({ ids, costo_tipo }),
      });
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setPending(false);
    }
  }

  async function bulkDelete(ids: string[]) {
    setPending(true);
    setError(null);
    try {
      return await request("/api/investimenti/transazioni/bulk", {
        method: "DELETE",
        body: JSON.stringify({ ids }),
      });
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setPending(false);
    }
  }

  return { bulkUpdateCostoTipo, bulkDelete, pending, error };
}
