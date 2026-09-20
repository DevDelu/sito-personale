"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SIDEBAR_SECTIONS } from "@/lib/sidebar-config";
import { interceptSessionNav } from "@/lib/allenamento/session-guard";

function isSectionActive(sectionHref: string, pathname: string): boolean {
  if (sectionHref === "#") return false;
  return pathname === sectionHref || pathname.startsWith(`${sectionHref}/`);
}

function SidebarContent() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col gap-1 overflow-y-auto p-3">
      <div className="px-3 py-3">
        <Link href="/spese" className="font-display text-base font-semibold tracking-tight">
          Radar
        </Link>
      </div>

      {SIDEBAR_SECTIONS.map((section) => {
        const attivo = isSectionActive(section.href, pathname);
        const Icon = section.icon;

        if (section.disabled) {
          return (
            <div
              key={section.id}
              className="mb-1 flex cursor-not-allowed items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-muted/60"
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {section.label}
              </span>
              {section.badge && (
                <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted/70">
                  {section.badge}
                </span>
              )}
            </div>
          );
        }

        return (
          <div key={section.id} className="mb-2">
            <Link
              href={section.href}
              onClick={(e) => {
                if (interceptSessionNav(section.href)) {
                  e.preventDefault();
                }
              }}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                attivo ? "bg-surface-hover text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {section.label}
            </Link>
            {attivo && section.subsections && (
              <div className="mt-1 ml-4 flex flex-col gap-0.5 border-l border-border pl-3">
                {section.subsections.map((sub) => {
                  const subAttivo =
                    sub.href === section.href
                      ? pathname === sub.href
                      : pathname === sub.href || pathname.startsWith(`${sub.href}/`);
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      onClick={(e) => {
                        if (interceptSessionNav(sub.href)) {
                          e.preventDefault();
                        }
                      }}
                      className={`rounded-md px-2 py-1.5 text-sm transition-colors ${
                        subAttivo
                          ? "font-medium text-accent"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      {sub.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

// Solo desktop: sotto md la navigazione dell'area privata è la tab bar in
// basso (components/shell/TabBar.tsx) più la pagina /altro, non più un
// drawer con hamburger.
export function Sidebar({ logoutSlot }: { logoutSlot: React.ReactNode }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-border bg-surface md:flex md:flex-col">
      <div className="flex-1 overflow-y-auto">
        <SidebarContent />
      </div>
      <div className="border-t border-border p-3">{logoutSlot}</div>
    </aside>
  );
}
