"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SIDEBAR_SECTIONS } from "@/lib/sidebar-config";

function isSectionActive(sectionHref: string, pathname: string): boolean {
  if (sectionHref === "#") return false;
  return pathname === sectionHref || pathname.startsWith(`${sectionHref}/`);
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col gap-1 overflow-y-auto p-3">
      <div className="px-3 py-3">
        <Link
          href="/spese"
          onClick={onNavigate}
          className="font-display text-base font-semibold tracking-tight"
        >
          Personal HQ
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
              onClick={onNavigate}
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
                      onClick={onNavigate}
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

export function Sidebar({ accountSlot }: { accountSlot: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/80 px-4 py-3 backdrop-blur-md md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Apri menu"
          className="btn-icon"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-display text-sm font-semibold">Personal HQ</span>
        {accountSlot}
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="modal-overlay !bg-black/50 !px-0 !justify-start"
            onClick={() => setOpen(false)}
          />
          <div className="animate-slide-up fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-surface">
            <div className="flex items-center justify-end p-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Chiudi menu"
                className="btn-icon"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop persistent sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-border bg-surface md:flex md:flex-col">
        <div className="flex-1 overflow-y-auto">
          <SidebarContent />
        </div>
        <div className="border-t border-border p-3">{accountSlot}</div>
      </aside>
    </>
  );
}
