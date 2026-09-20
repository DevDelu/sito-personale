"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

// Barra di navigazione compatta sticky, sempre visibile (non più il pattern
// "large title" che cresce/si riduce con lo scroll: dopo tre giri di bug
// legati proprio a quella doppia altezza — titolo grande + barra separata —
// una sola barra è più robusta e occupa meno spazio). Solo mobile
// (md:hidden): desktop resta il layout esistente con h1 semplice nella
// pagina.
export function PageHeader({
  title,
  parent,
  action,
}: {
  title: string;
  parent?: { href: string; label: string };
  action?: React.ReactNode;
}) {
  return (
    // .app-page-header è solo un marcatore: la regola CSS scoped
    // (.app-page-content:has(.app-page-header), app/globals.css) azzera il
    // padding-top per la safe-area già applicato dal contenuto della
    // pagina, perché questo componente applica la propria safe-area qui
    // sotto. Un'unica regola dichiarativa invece di calc() da tenere
    // sincronizzati in due file.
    <div className="app-page-header -mx-4 md:hidden">
      <div className="sticky top-0 z-20 border-b border-[var(--app-hairline)] bg-surface/85 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="grid h-12 grid-cols-[1fr_auto_1fr] items-center">
          {parent ? (
            <Link
              href={parent.href}
              className="app-static -ml-2 flex items-center gap-0.5 justify-self-start px-2 py-2 text-[17px] text-accent active:opacity-60"
            >
              <ChevronLeft className="h-5 w-5 shrink-0" strokeWidth={2.25} />
              <span className="max-w-[6rem] truncate">{parent.label}</span>
            </Link>
          ) : (
            <span />
          )}
          <span className="app-static col-start-2 truncate text-center text-[17px] font-semibold">
            {title}
          </span>
          <div className="flex justify-self-end">{action}</div>
        </div>
      </div>
    </div>
  );
}
