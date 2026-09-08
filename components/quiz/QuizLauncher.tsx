"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Il motore di gioco vero e proprio (timer, stato delle domande, client
// Supabase per l'auth) pesa e serve solo a chi gioca davvero: caricato via
// dynamic import con ssr:false, montato solo al click di una delle due CTA
// (o al ritorno dal redirect di login Google, vedi sotto).
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

export function QuizLauncher() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"guest" | "google">("guest");

  // Il login Google richiede una navigazione intera (redirect verso Google e
  // ritorno via /auth/callback): questo effetto riconosce il ritorno dal
  // redirect (query param `quiz=google` aggiunto prima di partire) e riapre
  // il gioco in modalità Google, ripulendo l'URL senza un reload.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("quiz") !== "google") return;

    // window.location non è leggibile durante il render (mismatch SSR), va
    // sincronizzato qui al mount: caso raro (solo al ritorno dal redirect di
    // login Google), non vale la pena derivarlo altrimenti.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode("google");
    setOpen(true);
    params.delete("quiz");
    const search = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${search ? `?${search}` : ""}#quiz`);
  }, []);

  async function handleGoogleClick() {
    const supabase = createClient();
    const gameUrl = `${window.location.origin}${window.location.pathname}?quiz=google#quiz`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent(gameUrl)}`,
      },
    });
  }

  function handleGuestClick() {
    setMode("guest");
    setOpen(true);
  }

  return (
    <>
      <div className="flex flex-wrap gap-3 pt-2">
        <button type="button" onClick={handleGoogleClick} className="btn-primary">
          Accedi con Google e gioca
        </button>
        <button type="button" onClick={handleGuestClick} className="btn-secondary">
          Gioca come ospite
        </button>
      </div>
      {open && <QuizGame mode={mode} onClose={() => setOpen(false)} />}
    </>
  );
}
