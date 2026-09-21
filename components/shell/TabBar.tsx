"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { SIDEBAR_SECTIONS } from "@/lib/sidebar-config";
import { interceptSessionNav } from "@/lib/allenamento/session-guard";

// Sezioni con slot dedicato (vedi lib/sidebar-config.ts), più "Altro" come
// ultimo slot fisso per tutto il resto (Carte, Agenda, Impostazioni...).
const TAB_SECTIONS = SIDEBAR_SECTIONS.filter((s) => s.mobileTab);

function isActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Nascosta durante una sessione di allenamento attiva (/allenamenti/sessione/*):
// più spazio al runner, meno tentazione di uscire a metà sessione.
function inSessioneAllenamento(pathname: string): boolean {
  return pathname.startsWith("/allenamenti/sessione/");
}

export function TabBar() {
  const pathname = usePathname();

  if (inSessioneAllenamento(pathname)) return null;

  const suAltro = !TAB_SECTIONS.some((s) => isActive(s.href, pathname));

  return (
    <nav
      aria-label="Navigazione principale"
      className="app-scroll fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface-hover pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_8px_rgba(0,0,0,0.15)] md:hidden"
      style={{ height: "calc(var(--app-tabbar-height) + env(safe-area-inset-bottom))" }}
    >
      {TAB_SECTIONS.map((section) => {
        const Icon = section.icon;
        const attivo = isActive(section.href, pathname);
        return (
          <Link
            key={section.id}
            href={section.href}
            aria-current={attivo ? "page" : undefined}
            onClick={(e) => {
              if (interceptSessionNav(section.href)) e.preventDefault();
            }}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 transition-colors duration-150 active:opacity-60 ${
              attivo ? "text-accent" : "text-muted"
            }`}
          >
            <Icon className="h-6 w-6" strokeWidth={attivo ? 2.25 : 1.75} />
            <span className="app-static text-[11px] leading-none font-medium">{section.label}</span>
          </Link>
        );
      })}
      <Link
        href="/altro"
        aria-current={suAltro ? "page" : undefined}
        onClick={(e) => {
          if (interceptSessionNav("/altro")) e.preventDefault();
        }}
        className={`flex flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 transition-colors duration-150 active:opacity-60 ${
          suAltro ? "text-accent" : "text-muted"
        }`}
      >
        <MoreHorizontal className="h-6 w-6" strokeWidth={suAltro ? 2.25 : 1.75} />
        <span className="app-static text-[11px] leading-none font-medium">Altro</span>
      </Link>
    </nav>
  );
}
