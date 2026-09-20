import type { Metadata } from "next";
import { ExternalLink, Layers, LogOut, Calendar, Bell } from "lucide-react";
import { logout } from "@/app/login/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { ListGroup, ListRow, ListRowLink } from "@/components/ui/ListGroup";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Altro" };

// Rotta raggiunta solo dalla tab bar mobile (md:hidden altrove): contiene i
// moduli senza slot dedicato nella tab bar, più le stesse azioni che su
// desktop vivono nella topbar/sidebar (tema, area pubblica, esci).
export default function AltroPage() {
  return (
    <div className="flex flex-col gap-6 md:hidden">
      <PageHeader title="Altro" />

      <div className="flex flex-col gap-6 px-4">
        <ListGroup>
          <ListRowLink href="/carte" icon={<Layers className="h-5 w-5" strokeWidth={1.75} />} title="Carte" chevron />
          <ListRowLink
            href="/agenda"
            icon={<Calendar className="h-5 w-5" strokeWidth={1.75} />}
            title="Agenda"
            chevron
          />
        </ListGroup>

        <ListGroup>
          <ListRowLink
            href="/impostazioni"
            icon={<Bell className="h-5 w-5" strokeWidth={1.75} />}
            title="Impostazioni"
            subtitle="Notifiche push"
            chevron
          />
          <ListRow title="Aspetto" subtitle="Tema chiaro o scuro" trailing={<ThemeToggle />} />
        </ListGroup>

        <ListGroup>
          <ListRowLink
            href="/"
            icon={<ExternalLink className="h-5 w-5" strokeWidth={1.75} />}
            title="Area pubblica"
          />
          <form action={logout}>
            <button type="submit" className="flex min-h-[56px] w-full items-center gap-3 pr-4 text-left active:bg-surface-hover">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                <LogOut className="h-5 w-5 text-spesa" strokeWidth={1.75} />
              </span>
              <span className="flex-1 text-[17px] text-spesa">Esci</span>
            </button>
          </form>
        </ListGroup>
      </div>
    </div>
  );
}
