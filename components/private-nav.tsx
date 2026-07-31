"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/spese", label: "Spese" },
  { href: "/spese/gestione", label: "Gestione" },
  { href: "/spese/importa", label: "Importa" },
  { href: "/spese/nuovo", label: "+ Aggiungi" },
] as const;

export function PrivateNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {LINKS.map((link) => {
        const attivo =
          link.href === "/spese" ? pathname === "/spese" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`group relative rounded-full px-3 py-1.5 text-sm transition-colors ${
              attivo ? "text-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            {link.label}
            <span
              className={`pointer-events-none absolute inset-x-3 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-accent transition-transform duration-200 ease-out group-hover:scale-x-100 ${
                attivo ? "scale-x-100" : ""
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
