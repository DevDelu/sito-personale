"use client";

import Link from "next/link";

// Pulsante d'azione flottante, ancorato in basso a destra sopra la tab bar:
// resta fermo sullo schermo durante lo scroll (fixed, non sticky) e vive
// solo nella pagina che lo monta esplicitamente (non nel layout condiviso).
// Con `href` naviga, con `onClick` esegue un'azione locale (es. apre uno sheet).
const FAB_CLASSI =
  "app-static fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform duration-150 ease-out active:scale-90 md:hidden";
// Stesso minimo di 20px della tab bar (components/shell/TabBar.tsx), altrimenti
// senza safe-area il FAB si sovrappone al bordo della barra.
const FAB_STILE = { bottom: "calc(var(--app-tabbar-height) + max(env(safe-area-inset-bottom), 20px) + 1rem)" };

export function FAB({
  label,
  icon,
  ...azione
}: {
  label: string;
  icon: React.ReactNode;
} & ({ href: string } | { onClick: () => void })) {
  if ("onClick" in azione) {
    return (
      <button type="button" onClick={azione.onClick} aria-label={label} className={FAB_CLASSI} style={FAB_STILE}>
        {icon}
      </button>
    );
  }
  return (
    <Link href={azione.href} aria-label={label} className={FAB_CLASSI} style={FAB_STILE}>
      {icon}
    </Link>
  );
}
