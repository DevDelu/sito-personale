"use client";

import Link from "next/link";

// Pulsante d'azione flottante, ancorato in basso a destra sopra la tab bar:
// resta fermo sullo schermo durante lo scroll (fixed, non sticky) e vive
// solo nella pagina che lo monta esplicitamente (non nel layout condiviso).
export function FAB({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="app-static fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform duration-150 ease-out active:scale-90 md:hidden"
      style={{ bottom: "calc(var(--app-tabbar-height) + env(safe-area-inset-bottom) + 1rem)" }}
    >
      {icon}
    </Link>
  );
}
