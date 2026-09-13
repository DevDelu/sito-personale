"use client";

import { useState } from "react";

export type PastoPatch = {
  data?: string;
  tipoPasto?: string;
  quantitaG?: number;
  note?: string | null;
};

async function request(id: string, init: RequestInit) {
  const res = await fetch(`/api/alimentazione/pasti/${id}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Errore durante l'operazione.");
  return json;
}

// Stesso pattern di useExpenseMutations.ts (Spese): update/delete per la
// tabella di Gestione, con stato pending/error condiviso.
export function usePastoMutations() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updatePasto(id: string, patch: PastoPatch) {
    setPending(true);
    setError(null);
    try {
      await request(id, { method: "PATCH", body: JSON.stringify(patch) });
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setPending(false);
    }
  }

  async function deletePasto(id: string) {
    setPending(true);
    setError(null);
    try {
      await request(id, { method: "DELETE" });
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setPending(false);
    }
  }

  return { updatePasto, deletePasto, pending, error };
}
