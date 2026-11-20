import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { NovitaElenco } from "@/components/novita/NovitaElenco";
import { listaNovita } from "@/lib/novita/queries";
import { SIDEBAR_SECTIONS } from "@/lib/sidebar-config";

export const metadata: Metadata = { title: "Novità" };

// Cosa è andato online e quando, spiegato semplice (vedi CLAUDE.md >
// "Novità e resoconti"). Le voci le scrive il workflow di deploy.
export default async function NovitaPage() {
  const novita = await listaNovita();
  const sotto = SIDEBAR_SECTIONS.find((s) => s.id === "novita")?.subsections ?? [];
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Novità" parent={{ href: "/altro", label: "Altro" }} />
      <SegmentedControl items={sotto} />
      <div className="hidden flex-col gap-1 md:flex">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Novità</h1>
        <p className="text-sm text-muted">Cosa è cambiato in Radar, giorno per giorno, a parole semplici.</p>
      </div>
      <div data-fb-area="novita.modifiche" className="contents">
        <NovitaElenco novita={novita} />
      </div>
    </div>
  );
}
