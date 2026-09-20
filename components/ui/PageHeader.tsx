"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

// Barra di navigazione compatta sticky (stile iOS "large title"): il titolo
// nella barra resta invisibile finché la pagina non ha scrollato oltre il
// titolo grande sotto, poi appare. Solo mobile (md:hidden): desktop resta
// il layout esistente con h1 semplice nella pagina.
export function PageHeader({
  title,
  parent,
  action,
}: {
  title: string;
  parent?: { href: string; label: string };
  action?: React.ReactNode;
}) {
  const [compatto, setCompatto] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setCompatto(!entry.isIntersecting), {
      threshold: 1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="-mx-4 md:hidden">
      <div
        className="sticky top-0 z-20 border-b bg-surface/85 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-md transition-colors duration-200"
        style={{ borderBottomColor: compatto ? "var(--app-hairline)" : "transparent" }}
      >
        <div className="grid h-11 grid-cols-[1fr_auto_1fr] items-center">
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
          <span
            className={`app-static col-start-2 truncate text-center text-[17px] font-semibold transition-opacity duration-150 ${
              compatto ? "opacity-100" : "opacity-0"
            }`}
          >
            {title}
          </span>
          <div className="flex justify-self-end">{action}</div>
        </div>
      </div>
      <div ref={sentinelRef} aria-hidden className="h-px" />
      <h1 className="app-static px-4 pt-3 pb-2 text-[32px] leading-tight font-bold tracking-tight">
        {title}
      </h1>
    </div>
  );
}
