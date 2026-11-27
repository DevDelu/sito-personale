"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { toastAperto } from "@/lib/feedback/avviso-in-basso";
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

  // Gli altri avvisi nella stessa posizione si spostano finché è aperto.
  useEffect(() => {
    toastAperto.imposta(toast !== null);
    return () => toastAperto.imposta(false);
  }, [toast]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), toast.durataMs ?? DURATA_TOAST_MS);
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
          {toast.azione && (
            <button
              type="button"
              onClick={() => {
                toast.azione?.onClick();
                setToast(null);
              }}
              className="pointer-events-auto -mr-2 ml-1 inline-flex min-h-11 items-center rounded-full px-3 text-[15px] font-semibold text-accent"
            >
              {toast.azione.etichetta}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
