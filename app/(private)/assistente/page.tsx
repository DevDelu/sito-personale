import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { ParlaConRadar } from "@/components/assistente/ParlaConRadar";

export const metadata: Metadata = { title: "Assistente" };

// Conversazione a voce con Radar (vedi CLAUDE.md > "Assistente"). La pagina
// è solo il guscio: microfono, sintesi vocale e storia vivono nel client.
export default function AssistentePage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Assistente" parent={{ href: "/altro", label: "Altro" }} />
      <div className="hidden flex-col gap-1 md:flex">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Assistente</h1>
        <p className="text-sm text-muted">Parla con Radar: spese, numeri, idee per l&apos;app.</p>
      </div>
      <div data-fb-area="assistente.pagina" className="contents">
        <ParlaConRadar />
      </div>
    </div>
  );
}
