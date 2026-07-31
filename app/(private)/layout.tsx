import Link from "next/link";
import { requireUser } from "@/lib/supabase/dal";
import { logout } from "@/app/login/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { PrivateNav } from "@/components/private-nav";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/80 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-4">
          <Link
            href="/spese"
            className="font-display text-sm font-semibold transition-opacity hover:opacity-80"
          >
            Archivio
          </Link>
          <PrivateNav />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <form action={logout}>
            <button type="submit" className="btn-secondary !px-3 !py-1.5">
              Esci
            </button>
          </form>
        </div>
      </header>
      <div className="flex flex-1 flex-col px-4 py-6 sm:px-6 animate-fade-in">{children}</div>
    </div>
  );
}
