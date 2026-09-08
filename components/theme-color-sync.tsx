"use client";

import { useEffect } from "react";
import { syncThemeColorMeta } from "@/lib/theme-color";

// Corregge il theme-color al mount: copre il caso in cui il tema salvato
// (o rilevato) differisca dalla preferenza di sistema usata per il
// theme-color statico renderizzato nell'head (vedi app/layout.tsx e
// app/[locale]/layout.tsx). Nessun elemento in output: solo un effetto.
export function ThemeColorSync() {
  useEffect(() => {
    syncThemeColorMeta();
  }, []);

  return null;
}
