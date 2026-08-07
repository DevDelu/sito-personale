"use client";

import { useState } from "react";
import {
  aggiornaEvento,
  creaEvento,
  eliminaEvento,
  salvaNotaGiorno,
  type EventoPatch,
} from "@/app/(private)/agenda/actions";

export function useAgendaMutations() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function crea(patch: EventoPatch) {
    setPending(true);
    setError(null);
    const res = await creaEvento(patch);
    setPending(false);
    if (res?.error) {
      setError(res.error);
      throw new Error(res.error);
    }
  }

  async function aggiorna(id: string, patch: Partial<EventoPatch>) {
    setPending(true);
    setError(null);
    const res = await aggiornaEvento(id, patch);
    setPending(false);
    if (res?.error) {
      setError(res.error);
      throw new Error(res.error);
    }
  }

  async function elimina(id: string) {
    setPending(true);
    setError(null);
    const res = await eliminaEvento(id);
    setPending(false);
    if (res?.error) {
      setError(res.error);
      throw new Error(res.error);
    }
  }

  async function salvaNota(data: string, contenuto: string) {
    setPending(true);
    setError(null);
    const res = await salvaNotaGiorno(data, contenuto);
    setPending(false);
    if (res?.error) {
      setError(res.error);
      throw new Error(res.error);
    }
  }

  return { crea, aggiorna, elimina, salvaNota, pending, error };
}
