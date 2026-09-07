"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { Menu, X } from "lucide-react";
import { SIDEBAR_SECTIONS } from "@/lib/sidebar-config";
import { interceptSessionNav } from "@/lib/allenamento/session-guard";

// Oltre questa distanza (px) o con un flick abbastanza veloce, uno swipe
// verso sinistra chiude il drawer come farebbe un'app nativa.
const CHIUDI_OFFSET_PX = 80;
const CHIUDI_VELOCITY = 500;

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
                  return;
                }
                onNavigate?.();
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
                          return;
                        }
                        onNavigate?.();
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

export function Sidebar({
  accountSlot,
  drawerFooterSlot,
  logoutSlot,
}: {
  // accountSlot: topbar sticky mobile, tenuto leggero (solo tema) per non
  // affollare una barra stretta. drawerFooterSlot: area pubblica + esci,
  // in fondo al drawer mobile (qui c'è spazio). Su desktop la barra in
  // alto a destra (tema + area pubblica) vive fuori da Sidebar, in
  // app/(private)/layout.tsx: in fondo alla sidebar desktop resta `logoutSlot`.
  accountSlot: React.ReactNode;
  drawerFooterSlot: React.ReactNode;
  logoutSlot: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/80 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 backdrop-blur-md md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Apri menu"
          className="btn-icon"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-display text-sm font-semibold">Radar</span>
        {accountSlot}
      </div>

      {/* Mobile drawer: trascinabile verso sinistra per chiudere (come un
          drawer nativo), entra/esce con una molla invece di un fade lineare. */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-40 md:hidden">
            <motion.div
              className="fixed inset-0 bg-black/50"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface shadow-2xl"
              drag="x"
              dragConstraints={{ left: -320, right: 0 }}
              dragElastic={{ left: 0.15, right: 0 }}
              onDragEnd={(_e, info: PanInfo) => {
                if (info.offset.x < -CHIUDI_OFFSET_PX || info.velocity.x < -CHIUDI_VELOCITY) setOpen(false);
              }}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
            >
              <div className="flex items-center justify-end p-2 pt-[calc(0.5rem+env(safe-area-inset-top))]">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Chiudi menu"
                  className="btn-icon"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SidebarContent onNavigate={() => setOpen(false)} />
              </div>
              <div className="border-t border-border p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                {drawerFooterSlot}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop persistent sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-border bg-surface md:flex md:flex-col">
        <div className="flex-1 overflow-y-auto">
          <SidebarContent />
        </div>
        <div className="border-t border-border p-3">{logoutSlot}</div>
      </aside>
    </>
  );
}
