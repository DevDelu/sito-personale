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
      <span>Area pubblica</span>
    </Link>
  );

  const logoutForm = (
    <form action={logout}>
      <button type="submit" className="btn-secondary !px-3 !py-1.5">
        Esci
      </button>
    </form>
  );

  // Su mobile la topbar sticky resta leggera (solo il toggle tema): area
  // pubblica ed esci vivono nel footer del drawer, non affollato quindi può
  // stare appaiato in riga invece che impilato — stessa dimensione/stile di
  // "Esci", solo icona al posto del testo per restare compatto. Su desktop
  // invece tema + area pubblica (versione con testo) vanno in una barra
  // sticky in alto a destra sopra il contenuto: "Esci" da solo resta in
  // fondo alla sidebar.
  const accountSlot = <ThemeToggle />;

  const areaPubblicaLinkCompatto = (
    <Link href="/" aria-label="Area pubblica" className="btn-secondary !px-3 !py-1.5">
      <ExternalLink className="h-3.5 w-3.5" />
    </Link>
  );

  const drawerFooterSlot = (
    <div className="flex items-center gap-2">
      {areaPubblicaLinkCompatto}
      {logoutForm}
    </div>
  );

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <Sidebar accountSlot={accountSlot} drawerFooterSlot={drawerFooterSlot} logoutSlot={logoutForm} />
      <div className="flex flex-1 flex-col">
        <div className="sticky top-0 z-20 hidden items-center justify-end gap-2 border-b border-border bg-surface/80 px-4 py-3 backdrop-blur-md sm:px-6 md:flex">
          <ThemeToggle />
          {areaPubblicaLink}
        </div>
        <div className="flex flex-1 flex-col px-4 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-6 animate-fade-in">
          {children}
        </div>
      </div>
    </div>
  );
}
