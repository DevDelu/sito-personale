import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireUser } from "@/lib/supabase/dal";
import { logout } from "@/app/login/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sidebar } from "@/components/sidebar";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  const areaPubblicaLink = (
    <Link href="/" aria-label="Area pubblica" className="btn-secondary flex items-center gap-1.5 !px-3 !py-1.5">
      <ExternalLink className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Area pubblica</span>
    </Link>
  );

  const logoutForm = (
    <form action={logout}>
      <button type="submit" className="btn-secondary !px-3 !py-1.5">
        Esci
      </button>
    </form>
  );

  // Su mobile tutto resta insieme nella topbar sticky (accountSlot, dentro
  // Sidebar). Su desktop invece tema + area pubblica vanno in una barra
  // sticky in alto a destra sopra il contenuto (non più in fondo alla
  // sidebar): "Esci" da solo resta in fondo alla sidebar.
  const accountSlot = (
    <div className="flex items-center gap-2">
      <ThemeToggle />
      {areaPubblicaLink}
      {logoutForm}
    </div>
  );

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <Sidebar accountSlot={accountSlot} logoutSlot={logoutForm} />
      <div className="flex flex-1 flex-col">
        <div className="sticky top-0 z-20 hidden items-center justify-end gap-2 border-b border-border bg-surface/80 px-4 py-3 backdrop-blur-md sm:px-6 md:flex">
          <ThemeToggle />
          {areaPubblicaLink}
        </div>
        <div className="flex flex-1 flex-col px-4 py-6 sm:px-6 animate-fade-in">{children}</div>
      </div>
    </div>
  );
}
