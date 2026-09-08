"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

// Il motore di gioco vero e proprio (timer, stato delle domande) pesa e
// serve solo a chi gioca davvero: caricato via dynamic import con
// ssr:false, montato solo al click della CTA.
const QuizGame = dynamic(() => import("./QuizGame").then((m) => m.QuizGame), {
  ssr: false,
  loading: () => (
    <div className="modal-overlay">
      <div className="modal-panel flex w-full max-w-md items-center justify-center p-10">
        <span className="text-sm text-muted">Caricamento del gioco...</span>
      </div>
    </div>
  ),
});

// Login Google temporaneamente disattivato (provider non configurato lato
// Supabase): si gioca solo come ospite, punteggio non salvato in classifica.
export function QuizLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap gap-3 pt-2">
        <button type="button" onClick={() => setOpen(true)} className="btn-primary !px-6 !py-3 text-base">
          Gioca
        </button>
      </div>
      {open && <QuizGame onClose={() => setOpen(false)} />}
    </>
  );
}
