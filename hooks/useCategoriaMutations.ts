"use client";

import { useState } from "react";
import type { Categoria, TipoCategoria } from "@/lib/types";

export function useCategoriaMutations() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function creaCategoria(nome: string, tipo: TipoCategoria): Promise<Categoria> {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/categorie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, tipo }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Errore durante la creazione della categoria.");
      return json.categoria as Categoria;
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setPending(false);
    }
  }

  return { creaCategoria, pending, error };
}
