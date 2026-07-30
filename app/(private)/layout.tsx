import Link from "next/link";
import { requireUser } from "@/lib/supabase/dal";
import { logout } from "@/app/login/actions";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <nav className="flex items-center gap-4">
          <Link href="/spese" className="font-display text-sm font-semibold">
            Archivio
          </Link>
          <Link
            href="/spese"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Spese
          </Link>
          <Link
            href="/spese/gestione"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Gestione
          </Link>
          <Link
            href="/spese/importa"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Importa
          </Link>
          <Link
            href="/spese/nuovo"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            + Aggiungi
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <form action={logout}>
            <button
              type="submit"
              className="rounded-full border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
            >
              Esci
            </button>
          </form>
        </div>
      </header>
      <div className="flex flex-1 flex-col px-4 py-6 sm:px-6">{children}</div>
    </div>
  );
}
