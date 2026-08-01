"use client";

import { useState } from "react";
import type { Asset, TipoAsset } from "@/lib/investimenti/types";

export function useAssetMutations() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function creaAsset(input: { ticker: string; nome: string; tipo: TipoAsset; isin?: string | null }) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/investimenti/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Errore durante la creazione dell'asset.");
      return json as Asset;
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setPending(false);
    }
  }

  return { creaAsset, pending, error };
}
