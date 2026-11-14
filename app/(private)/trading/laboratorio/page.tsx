import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SIDEBAR_SECTIONS } from "@/lib/sidebar-config";
import { Laboratorio } from "@/components/trading/Laboratorio";

export const metadata: Metadata = { title: "Laboratorio di trading" };

const SEGMENTI = SIDEBAR_SECTIONS.find((s) => s.id === "trading")!.subsections!;

const ESERCIZI = [
  "Il trend è rialzista, ribassista o laterale? Rispondi prima di accendere qualsiasi indicatore.",
  "Segna con Livello almeno un supporto e una resistenza dove il prezzo ha rimbalzato due volte.",
  "Traccia una trendline collegando due minimi (o massimi) e guarda se il prezzo la rispetta dopo.",
  "Accendi SMA 20 e SMA 50: confermano la tua lettura del trend?",
  "Accendi RSI: trova un punto sopra 70 o sotto 30. Cosa è successo dopo?",
  "Scegli un punto di ingresso immaginario: dove metteresti lo stop? Il target è almeno al doppio della distanza?",
];

export default function LaboratorioPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title="Laboratorio" parent={{ href: "/trading", label: "Corso" }} />
      <SegmentedControl items={SEGMENTI} />

      <div className="hidden flex-col gap-1 md:flex">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Laboratorio</h1>
        <p className="text-sm text-muted">Grafici simulati sempre nuovi per allenare l&apos;occhio.</p>
      </div>

      <div data-fb-area="trading.laboratorio.grafico" className="contents">
        <Laboratorio />
      </div>

      <div data-fb-area="trading.laboratorio.esercizi" className="contents">
        <section className="card flex flex-col gap-3 p-5">
          <h2 className="text-[17px] font-semibold">Esercizi su ogni grafico</h2>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-[15px] leading-relaxed">
            {ESERCIZI.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
