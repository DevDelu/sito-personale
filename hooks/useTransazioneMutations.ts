"use client";

import { useState } from "react";
import type { CostoTipo, TipoTransazione } from "@/lib/investimenti/types";

export type TransazionePatch = {
  asset_id?: string;
  tipo?: TipoTransazione;
  quantita?: number;
  prezzo_unitario?: number | null;
  data?: string;
  costo_tipo?: CostoTipo;
  note?: string | null;
};

async function request(path: string, init: RequestInit) {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Errore durante l'operazione.");
  return json;
}

export function useTransazioneMutations() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createTransazione(patch: TransazionePatch) {
    setPending(true);
    setError(null);
    try {
      return await request("/api/investimenti/transazioni", {
        method: "POST",
        body: JSON.stringify(patch),
      });
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setPending(false);
    }
  }

  async function updateTransazione(id: string, patch: TransazionePatch) {
    setPending(true);
    setError(null);
    try {
      return await request(`/api/investimenti/transazioni/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setPending(false);
    }
  }

  async function deleteTransazione(id: string) {
    setPending(true);
    setError(null);
    try {
      return await request(`/api/investimenti/transazioni/${id}`, { method: "DELETE" });
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setPending(false);
    }
  }

  return { createTransazione, updateTransazione, deleteTransazione, pending, error };
}
