"use client";

import { useState } from "react";
import type { ComposizioneItem, TemplatePasto, TipoPasto } from "@/lib/alimentazione/types";

export type TemplateCreateInput = {
  giornoSettimana: number | null; // null = jolly, vedi types.ts
  tipoPasto: TipoPasto;
  nome: string;
  composizione: ComposizioneItem[];
  note?: string | null;
};

export type TemplatePatch = {
  nome?: string;
  composizione?: ComposizioneItem[];
  note?: string | null;
  tipoPasto?: TipoPasto;
};

// Stesso pattern di usePastoMutations.ts: update/delete (+ create, la
// griglia template può creare una cella vuota) con stato pending/error
// condiviso.
export function useTemplateMutations() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function request(path: string, init: RequestInit) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(path, {
        ...init,
        headers: { "Content-Type": "application/json", ...init.headers },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Errore durante l'operazione.");
      return json;
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setPending(false);
    }
  }

  async function creaTemplate(input: TemplateCreateInput): Promise<TemplatePasto> {
    const json = await request("/api/alimentazione/template", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return json.template as TemplatePasto;
  }

  async function updateTemplate(id: string, patch: TemplatePatch) {
    await request(`/api/alimentazione/template/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
  }

  async function deleteTemplate(id: string) {
    await request(`/api/alimentazione/template/${id}`, { method: "DELETE" });
  }

  return { creaTemplate, updateTemplate, deleteTemplate, pending, error };
}
