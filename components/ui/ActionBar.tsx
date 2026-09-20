"use client";

// Barra d'azione fissa sopra la tab bar, per la selezione multipla in stile
// iOS (es. Gestione movimenti in Spese). Solo mobile: su desktop la
// selezione multipla resta la barra inline esistente sopra la tabella.
export function ActionBar({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="app-scroll fixed inset-x-0 z-30 flex items-center justify-center gap-2 border-t border-border bg-surface/95 px-4 py-2.5 backdrop-blur-md md:hidden"
      style={{ bottom: "calc(var(--app-tabbar-height) + env(safe-area-inset-bottom))" }}
    >
      {children}
    </div>
  );
}
