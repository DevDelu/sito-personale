import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireUser } from "@/lib/supabase/dal";
import { logout } from "@/app/login/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sidebar } from "@/components/sidebar";
import { TabBar } from "@/components/shell/TabBar";
import { appViewport } from "@/lib/app-viewport";

export const viewport = appViewport;

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

  return (
    // .app-shell delimita lo scope di tutto lo stile mobile nuovo (vedi
    // "UI mobile" in CLAUDE.md): sotto 768px la tab bar in basso sostituisce
    // la topbar con hamburger/drawer di prima, quindi il contenuto ha
    // padding sia sopra (safe-area) che sotto (tab bar + safe-area).
    // Da md in su la sidebar desktop resta identica a prima.
    // min-h-[100dvh] (non min-h-full): min-height:100% richiede che OGNI
    // antenato (html, body) abbia un'altezza esplicita perché la percentuale
    // si risolva, altrimenti equivale ad "auto" — su una pagina con poco
    // contenuto (Altro) .app-shell restava più basso del viewport reale e
    // il "flex-1 justify-center" delle pagine corte (Altro, Allenamento) non
    // aveva spazio in cui centrarsi, lasciando lo sfondo vuoto sotto la tab
    // bar. 100dvh è ancorato al viewport reale, stesso pattern già usato in
    // app/login/page.tsx e affini.
    <div className="app-shell flex min-h-[100dvh] flex-1 flex-col md:flex-row">
      <Sidebar logoutSlot={logoutForm} />
      <div className="flex flex-1 flex-col">
        <div className="sticky top-0 z-20 hidden items-center justify-end gap-2 border-b border-border bg-surface/80 px-4 py-3 backdrop-blur-md sm:px-6 md:flex">
          <ThemeToggle />
          {areaPubblicaLink}
        </div>
        <div className="app-page-content animate-fade-in flex flex-1 flex-col px-4 pb-[calc(var(--app-tabbar-height)+max(env(safe-area-inset-bottom),20px)+1rem)] sm:px-6 md:pt-6 md:pb-6">
          {children}
        </div>
      </div>
      <TabBar />
    </div>
  );
}
