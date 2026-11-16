"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { DURATA_TOAST_MS, registraToast, type ToastAttivo } from "@/lib/toast/bus";

// Conferma breve sopra la tab bar (mobile) o in basso al centro (desktop).
// role="status": gli screen reader la leggono senza rubare il focus. Il testo
// non contiene importi, quindi non serve la modalità discreta.
export function ToastHost() {
  const [toast, setToast] = useState<ToastAttivo | null>(null);

  useEffect(() => {
    registraToast(setToast);
    return () => registraToast(null);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), DURATA_TOAST_MS);
    return () => window.clearTimeout(t);
  }, [toast]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--app-tabbar-height)+max(env(safe-area-inset-bottom),20px)+0.75rem)] z-40 flex justify-center px-4 md:bottom-6"
    >
      {toast && (
        <div
          key={toast.id}
          className="animate-slide-up flex min-h-11 max-w-sm items-center gap-2 rounded-full border border-border bg-surface-hover px-4 py-2 text-[15px] shadow-lg"
        >
          <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden />
          <span>{toast.testo}</span>
        </div>
      )}
    </div>
  );
}
