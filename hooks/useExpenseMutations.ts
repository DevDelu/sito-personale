"use client";

import { useState } from "react";

export type MovimentoPatch = {
  importo?: number;
  data?: string;
  categoria_id?: string;
  titolo?: string;
  descrizione?: string | null;
  nominativo?: string | null;
  dettaglio?: string | null;
};

async function request(tipo: "spesa" | "entrata", id: string, init: RequestInit) {
  const res = await fetch(`/api/movimenti/${tipo}/${id}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Errore durante l'operazione.");
  return json;
}

export function useExpenseMutations() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateExpense(tipo: "spesa" | "entrata", id: string, patch: MovimentoPatch) {
    setPending(true);
    setError(null);
    try {
      await request(tipo, id, { method: "PATCH", body: JSON.stringify(patch) });
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setPending(false);
    }
  }

  async function deleteExpense(tipo: "spesa" | "entrata", id: string) {
    setPending(true);
    setError(null);
    try {
      await request(tipo, id, { method: "DELETE" });
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setPending(false);
    }
  }

  return { updateExpense, deleteExpense, pending, error };
}
