"use client";

import { useState } from "react";
import { modificaCarta, eliminaCarta, type ModificaCartaPatch } from "@/app/(private)/carte/actions";

export function useCarteMutations() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateCarta(id: number, cardId: number, patch: ModificaCartaPatch) {
    setPending(true);
    setError(null);
    const res = await modificaCarta(id, cardId, patch);
    setPending(false);
    if (res?.error) {
      setError(res.error);
      throw new Error(res.error);
    }
  }

  async function deleteCarta(id: number) {
    setPending(true);
    setError(null);
    const res = await eliminaCarta(id);
    setPending(false);
    if (res?.error) {
      setError(res.error);
      throw new Error(res.error);
    }
  }

  return { updateCarta, deleteCarta, pending, error };
}
