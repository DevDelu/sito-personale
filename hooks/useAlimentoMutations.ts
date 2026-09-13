"use client";

import { useState } from "react";
import type { Alimento } from "@/lib/alimentazione/types";

// Creazione inline di un alimento dal form "aggiungi pasto", stesso pattern
// di useCategoriaMutations.ts (Spese).
export function useAlimentoMutations() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function creaAlimento(input: {
    nome: string;
    kcal100g: number;
    proteine100g: number;
    carboidrati100g: number;
    grassi100g: number;
  }): Promise<Alimento> {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/alimentazione/alimenti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Errore durante la creazione dell'alimento.");
      return json.alimento as Alimento;
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setPending(false);
    }
  }

  return { creaAlimento, pending, error };
}
