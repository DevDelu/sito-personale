"use client";

import { useState } from "react";
import { creaImpegnoFisso, eliminaImpegnoFisso, type ImpegnoFissoPatch } from "@/app/(private)/allenamenti/actions";

export function useImpegniMutations() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function creaImpegno(patch: ImpegnoFissoPatch) {
    setPending(true);
    setError(null);
    const res = await creaImpegnoFisso(patch);
    setPending(false);
    if (res?.error) {
      setError(res.error);
      throw new Error(res.error);
    }
  }

  async function eliminaImpegno(id: string) {
    setPending(true);
    setError(null);
    const res = await eliminaImpegnoFisso(id);
    setPending(false);
    if (res?.error) {
      setError(res.error);
      throw new Error(res.error);
    }
  }

  return { creaImpegno, eliminaImpegno, pending, error };
}
